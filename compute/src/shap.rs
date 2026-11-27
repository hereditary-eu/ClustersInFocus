//! Mean |SHAP| feature importance from a random-forest surrogate, mirroring the Python backend's
//! `xgboost.XGBRFRegressor(n_estimators=100, learning_rate=0.1, max_depth=6)` + `shap.TreeExplainer`.

use crate::rng::Rng;

const N_TREES: usize = 100;
const LEARNING_RATE: f64 = 0.1;
const MAX_DEPTH: usize = 6;
// XGBRFRegressor defaults
const SUBSAMPLE: f64 = 0.8;
const COLSAMPLE_BYNODE: f64 = 0.8;
const LAMBDA: f64 = 1e-5;
const MIN_SPLIT_GAIN: f64 = 1e-6;

/// Leaf when `left == 0` (the root is node 0, so no child ever has index 0).
struct Node {
    feature: usize,
    threshold: f64,
    left: usize,
    right: usize,
    value: f64,
    cover: f64,
}

/// Column-major `x` (n_rows per column). Returns one importance per column; the target's is 0.
pub fn importance(x: &[f64], n_rows: usize, target: usize, rng: &mut Rng) -> Vec<f64> {
    let n_cols = x.len() / n_rows.max(1);
    let x = zscore(x, n_rows);
    let col = |c: usize| &x[c * n_rows..(c + 1) * n_rows];
    let y = col(target);
    let base = y.iter().sum::<f64>() / n_rows as f64;
    let grad: Vec<f64> = y.iter().map(|v| base - v).collect();
    let features: Vec<usize> = (0..n_cols).filter(|&c| c != target).collect();

    let trees: Vec<Vec<Node>> = (0..N_TREES)
        .map(|_| {
            let mut rows: Vec<usize> = (0..n_rows).filter(|_| rng.f64() < SUBSAMPLE).collect();
            if rows.is_empty() {
                rows = (0..n_rows).collect();
            }
            let mut tree = vec![];
            grow(&mut tree, &x, n_rows, &grad, &mut rows, &features, 0, rng);
            tree
        })
        .collect();

    // ponytail: explains every row, O(rows · trees · leaves · depth²); sample rows if datasets get huge
    let mut total = vec![0.0; n_cols];
    let mut phi = vec![0.0; n_cols];
    for r in 0..n_rows {
        phi.fill(0.0);
        let value = |c: usize| x[c * n_rows + r];
        for tree in &trees {
            tree_shap(tree, &value, &mut phi, 0, Vec::with_capacity(MAX_DEPTH + 2), 1.0, 1.0, usize::MAX);
        }
        for (t, p) in total.iter_mut().zip(&phi) {
            *t += p.abs();
        }
    }
    total.iter().map(|t| t / n_rows as f64).collect()
}

/// pandas-style z-score (ddof = 1); constant columns become 0.
fn zscore(x: &[f64], n_rows: usize) -> Vec<f64> {
    x.chunks(n_rows.max(1))
        .flat_map(|c| {
            let mean = c.iter().sum::<f64>() / c.len() as f64;
            let std = (c.iter().map(|v| (v - mean).powi(2)).sum::<f64>() / (c.len() as f64 - 1.0)).sqrt();
            c.iter().map(move |v| {
                let z = (v - mean) / std;
                if z.is_finite() { z } else { 0.0 }
            })
        })
        .collect()
}

/// Greedy exact split finding on squared error (hessian 1 per row), like xgboost's `exact` method.
#[allow(clippy::too_many_arguments)]
fn grow(
    tree: &mut Vec<Node>,
    x: &[f64],
    n_rows: usize,
    grad: &[f64],
    rows: &mut [usize],
    features: &[usize],
    depth: usize,
    rng: &mut Rng,
) -> usize {
    let id = tree.len();
    let g: f64 = rows.iter().map(|&r| grad[r]).sum();
    let h = rows.len() as f64;
    // xgboost scales each parallel tree's leaves by learning_rate / n_trees
    let value = -g / (h + LAMBDA) * LEARNING_RATE / N_TREES as f64;
    tree.push(Node { feature: 0, threshold: 0.0, left: 0, right: 0, value, cover: h });
    if depth == MAX_DEPTH || rows.len() < 2 || features.is_empty() {
        return id;
    }

    let mut candidates = features.to_vec();
    let m = ((features.len() as f64 * COLSAMPLE_BYNODE) as usize).max(1);
    for i in 0..m {
        let j = i + rng.below(candidates.len() - i);
        candidates.swap(i, j);
    }

    let parent = g * g / (h + LAMBDA);
    let mut best = (MIN_SPLIT_GAIN, 0, 0.0);
    for &f in &candidates[..m] {
        let v = |r: usize| x[f * n_rows + r];
        rows.sort_by(|&a, &b| v(a).total_cmp(&v(b)));
        let mut gl = 0.0;
        for w in 0..rows.len() - 1 {
            gl += grad[rows[w]];
            let (cur, next) = (v(rows[w]), v(rows[w + 1]));
            if cur == next {
                continue;
            }
            let hl = (w + 1) as f64;
            let gain = gl * gl / (hl + LAMBDA) + (g - gl).powi(2) / (h - hl + LAMBDA) - parent;
            if gain > best.0 {
                best = (gain, f, (cur + next) / 2.0);
            }
        }
    }
    if best.0 <= MIN_SPLIT_GAIN {
        return id;
    }

    let (_, f, threshold) = best;
    let v = |r: usize| x[f * n_rows + r];
    rows.sort_by(|&a, &b| v(a).total_cmp(&v(b)));
    let (lrows, rrows) = rows.split_at_mut(rows.partition_point(|&r| v(r) < threshold));
    let left = grow(tree, x, n_rows, grad, lrows, features, depth + 1, rng);
    let right = grow(tree, x, n_rows, grad, rrows, features, depth + 1, rng);
    tree[id] = Node { feature: f, threshold, left, right, value: 0.0, cover: h };
    id
}

#[derive(Clone, Copy)]
struct PathElem {
    feature: usize,
    zero: f64,
    one: f64,
    weight: f64,
}

/// TreeSHAP (Lundberg et al. 2018, Algorithm 2), ported from shap's tree_shap.h.
#[allow(clippy::too_many_arguments)]
fn tree_shap(
    tree: &[Node],
    x: &impl Fn(usize) -> f64,
    phi: &mut [f64],
    node: usize,
    mut path: Vec<PathElem>,
    zero: f64,
    one: f64,
    feature: usize,
) {
    extend(&mut path, zero, one, feature);
    let n = &tree[node];
    if n.left == 0 {
        for i in 1..path.len() {
            let e = path[i];
            phi[e.feature] += unwound_sum(&path, i) * (e.one - e.zero) * n.value;
        }
        return;
    }
    let (hot, cold) = if x(n.feature) < n.threshold { (n.left, n.right) } else { (n.right, n.left) };
    let (mut iz, mut io) = (1.0, 1.0);
    if let Some(k) = path.iter().position(|e| e.feature == n.feature) {
        iz = path[k].zero;
        io = path[k].one;
        unwind(&mut path, k);
    }
    tree_shap(tree, x, phi, hot, path.clone(), iz * tree[hot].cover / n.cover, io, n.feature);
    tree_shap(tree, x, phi, cold, path, iz * tree[cold].cover / n.cover, 0.0, n.feature);
}

fn extend(path: &mut Vec<PathElem>, zero: f64, one: f64, feature: usize) {
    let d = path.len();
    path.push(PathElem { feature, zero, one, weight: if d == 0 { 1.0 } else { 0.0 } });
    for i in (0..d).rev() {
        path[i + 1].weight += one * path[i].weight * (i + 1) as f64 / (d + 1) as f64;
        path[i].weight = zero * path[i].weight * (d - i) as f64 / (d + 1) as f64;
    }
}

fn unwind(path: &mut Vec<PathElem>, k: usize) {
    let d = path.len() - 1;
    let (one, zero) = (path[k].one, path[k].zero);
    let mut next = path[d].weight;
    for i in (0..d).rev() {
        if one != 0.0 {
            let tmp = path[i].weight;
            path[i].weight = next * (d + 1) as f64 / ((i + 1) as f64 * one);
            next = tmp - path[i].weight * zero * (d - i) as f64 / (d + 1) as f64;
        } else {
            path[i].weight = path[i].weight * (d + 1) as f64 / (zero * (d - i) as f64);
        }
    }
    for i in k..d {
        path[i] = PathElem { weight: path[i].weight, ..path[i + 1] };
    }
    path.pop();
}

fn unwound_sum(path: &[PathElem], k: usize) -> f64 {
    let d = path.len() - 1;
    let (one, zero) = (path[k].one, path[k].zero);
    let mut next = path[d].weight;
    let mut total = 0.0;
    for i in (0..d).rev() {
        if one != 0.0 {
            let tmp = next * (d + 1) as f64 / ((i + 1) as f64 * one);
            total += tmp;
            next = path[i].weight - tmp * zero * (d - i) as f64 / (d + 1) as f64;
        } else if zero != 0.0 {
            total += path[i].weight / zero / ((d - i) as f64 / (d + 1) as f64);
        }
    }
    total
}

#[cfg(test)]
mod tests {
    use super::*;

    fn predict(tree: &[Node], x: &impl Fn(usize) -> f64) -> f64 {
        let mut n = &tree[0];
        while n.left != 0 {
            n = &tree[if x(n.feature) < n.threshold { n.left } else { n.right }];
        }
        n.value
    }

    /// Local accuracy: the SHAP values of a row sum to its prediction minus the expected prediction.
    #[test]
    fn shap_values_add_up() {
        let (n_rows, n_cols) = (60, 4);
        let mut rng = Rng::new(7);
        let x: Vec<f64> = (0..n_rows * n_cols).map(|_| rng.f64()).collect();
        let grad: Vec<f64> = (0..n_rows).map(|r| -(3.0 * x[r] + x[n_rows + r] * x[2 * n_rows + r])).collect();
        let mut tree = vec![];
        grow(&mut tree, &x, n_rows, &grad, &mut (0..n_rows).collect::<Vec<_>>(), &[0, 1, 2, 3], 0, &mut rng);
        assert!(tree.len() > 7);

        let leaves = tree.iter().filter(|n| n.left == 0);
        let expected: f64 = leaves.map(|n| n.value * n.cover / tree[0].cover).sum();
        for r in 0..n_rows {
            let value = |c: usize| x[c * n_rows + r];
            let mut phi = vec![0.0; n_cols];
            tree_shap(&tree, &value, &mut phi, 0, vec![], 1.0, 1.0, usize::MAX);
            let sum: f64 = phi.iter().sum();
            assert!((sum - (predict(&tree, &value) - expected)).abs() < 1e-12, "row {r}");
        }
    }

    #[test]
    fn importance_finds_the_driving_feature() {
        let n_rows = 100;
        let mut rng = Rng::new(3);
        let noise: Vec<f64> = (0..n_rows).map(|_| rng.f64()).collect();
        let driver: Vec<f64> = (0..n_rows).map(|_| rng.f64()).collect();
        let target: Vec<f64> = driver.iter().map(|d| 2.0 * d).collect();
        let x = [noise, driver, target].concat();
        let imp = importance(&x, n_rows, 2, &mut Rng::new(1));
        assert_eq!(imp[2], 0.0);
        assert!(imp[1] > 10.0 * imp[0], "{imp:?}");
    }
}
