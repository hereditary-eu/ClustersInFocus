use std::collections::HashMap;

use crate::rng::Rng;

const RESTARTS: usize = 5;

/// K-Means on 2D points: the lowest-inertia result of a few restarts (scikit-learn runs one),
/// so a single unlucky seeding cannot leave a pair in a poor local optimum.
pub fn kmeans(x: &[f64], y: &[f64], k: usize, max_iter: usize, rng: &mut Rng) -> Vec<i32> {
    (0..RESTARTS)
        .map(|_| kmeans_once(x, y, k, max_iter, rng))
        .min_by(|a, b| inertia(x, y, a).total_cmp(&inertia(x, y, b)))
        .unwrap()
}

fn inertia(x: &[f64], y: &[f64], labels: &[i32]) -> f64 {
    let mut sums: std::collections::BTreeMap<i32, (f64, f64, f64, f64, f64)> = Default::default();
    for ((&l, &a), &b) in labels.iter().zip(x).zip(y) {
        let s = sums.entry(l).or_default();
        *s = (s.0 + a, s.1 + b, s.2 + a * a, s.3 + b * b, s.4 + 1.0);
    }
    sums.values().map(|(sx, sy, sxx, syy, n)| sxx - sx * sx / n + syy - sy * sy / n).sum()
}

/// Greedy k-means++ seeding (as in scikit-learn), then Lloyd iterations until no label changes.
fn kmeans_once(x: &[f64], y: &[f64], k: usize, max_iter: usize, rng: &mut Rng) -> Vec<i32> {
    let n = x.len();
    if n == 0 {
        return vec![];
    }
    let k = k.clamp(1, n);
    let d2 = |i: usize, c: (f64, f64)| (x[i] - c.0).powi(2) + (y[i] - c.1).powi(2);

    let first = rng.below(n);
    let mut centers = vec![(x[first], y[first])];
    let mut dist: Vec<f64> = (0..n).map(|i| d2(i, centers[0])).collect();
    let trials = 2 + (k as f64).ln() as usize;
    while centers.len() < k {
        // draw a few candidates with probability ∝ D², keep the one that lowers the potential most
        let total: f64 = dist.iter().sum();
        let mut best: Option<(f64, Vec<f64>, (f64, f64))> = None;
        for _ in 0..trials {
            let pick = if total > 0.0 {
                let mut target = rng.f64() * total;
                dist.iter()
                    .position(|&d| {
                        target -= d;
                        target < 0.0
                    })
                    .unwrap_or(n - 1)
            } else {
                rng.below(n)
            };
            let c = (x[pick], y[pick]);
            let cand: Vec<f64> = dist.iter().enumerate().map(|(i, &d)| d.min(d2(i, c))).collect();
            let potential = cand.iter().sum();
            if best.as_ref().is_none_or(|b| potential < b.0) {
                best = Some((potential, cand, c));
            }
        }
        let (_, cand, c) = best.unwrap();
        dist = cand;
        centers.push(c);
    }

    let mut labels = vec![-1i32; n];
    for _ in 0..max_iter {
        let mut changed = false;
        for (i, label) in labels.iter_mut().enumerate() {
            let best = (0..k).min_by(|&a, &b| d2(i, centers[a]).total_cmp(&d2(i, centers[b]))).unwrap() as i32;
            changed |= *label != best;
            *label = best;
        }
        if !changed {
            break;
        }
        let mut sums = vec![(0.0, 0.0, 0usize); k];
        for (i, &l) in labels.iter().enumerate() {
            let s = &mut sums[l as usize];
            s.0 += x[i];
            s.1 += y[i];
            s.2 += 1;
        }
        for (c, s) in centers.iter_mut().zip(&sums) {
            if s.2 > 0 {
                *c = (s.0 / s.2 as f64, s.1 / s.2 as f64);
            }
        }
    }
    labels
}

/// DBSCAN on 2D points with scikit-learn's semantics: a point is core when at least `min_samples`
/// points (itself included) lie within `eps`; clusters are numbered by their lowest-index core point,
/// a border point joins the first cluster that reaches it, and noise is -1.
pub fn dbscan(x: &[f64], y: &[f64], eps: f64, min_samples: usize) -> Vec<i32> {
    let n = x.len();
    // Hash points into eps-sized cells so all neighbours lie in the surrounding 3x3 cells.
    let cell = |i: usize| ((x[i] / eps).floor() as i64, (y[i] / eps).floor() as i64);
    let mut grid: HashMap<(i64, i64), Vec<usize>> = HashMap::new();
    for i in 0..n {
        grid.entry(cell(i)).or_default().push(i);
    }
    // ponytail: stores every neighbourhood like scikit-learn does, O(n²) memory when eps covers most points
    let neighbours: Vec<Vec<usize>> = (0..n)
        .map(|i| {
            let (cx, cy) = cell(i);
            let mut out = vec![];
            for dx in -1..=1 {
                for dy in -1..=1 {
                    if let Some(cands) = grid.get(&(cx.saturating_add(dx), cy.saturating_add(dy))) {
                        out.extend(
                            cands
                                .iter()
                                .copied()
                                .filter(|&j| (x[i] - x[j]).powi(2) + (y[i] - y[j]).powi(2) <= eps * eps),
                        );
                    }
                }
            }
            out
        })
        .collect();
    let core: Vec<bool> = neighbours.iter().map(|nb| nb.len() >= min_samples).collect();

    let mut labels = vec![-1i32; n];
    let mut next = 0;
    for start in 0..n {
        if labels[start] != -1 || !core[start] {
            continue;
        }
        labels[start] = next;
        let mut stack = vec![start];
        while let Some(i) = stack.pop() {
            if !core[i] {
                continue;
            }
            for &j in &neighbours[i] {
                if labels[j] == -1 {
                    labels[j] = next;
                    stack.push(j);
                }
            }
        }
        next += 1;
    }
    labels
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn kmeans_separates_two_blobs() {
        let x = [0.0, 0.1, 0.2, 10.0, 10.1, 10.2];
        let y = [0.0, 0.1, 0.0, 10.0, 10.1, 10.0];
        let l = kmeans(&x, &y, 2, 100, &mut Rng::new(1));
        assert!(l[0] == l[1] && l[1] == l[2] && l[3] == l[4] && l[4] == l[5] && l[0] != l[3]);
    }

    #[test]
    fn dbscan_marks_noise_and_border() {
        // a chain 0-1-2 within eps, and an isolated point 3
        let x = [0.0, 1.0, 2.0, 10.0];
        let y = [0.0; 4];
        assert_eq!(dbscan(&x, &y, 1.0, 3), vec![0, 0, 0, -1]); // only 1 is core; 0 and 2 are border
        assert_eq!(dbscan(&x, &y, 1.0, 4), vec![-1; 4]);
    }
}
