use kodama::{Method, linkage};

/// Row/column order for a symmetric n×n similarity matrix (row-major), matching the Python backend:
/// "optimal" is average linkage on 1 - similarity with optimal leaf ordering (Bar-Joseph et al. 2001),
/// "average" sorts by mean off-diagonal similarity, anything else keeps the order.
pub fn reorder(sim: &[f64], n: usize, method: &str) -> Vec<usize> {
    let identity: Vec<usize> = (0..n).collect();
    if n <= 2 {
        return identity;
    }
    match method {
        "optimal" => optimal(sim, n).unwrap_or(identity),
        "average" => {
            let avg = |i: usize| (0..n).filter(|&j| j != i).map(|j| sim[i * n + j]).sum::<f64>() / (n - 1) as f64;
            let mut order = identity;
            order.sort_by(|&a, &b| avg(b).total_cmp(&avg(a))); // stable, like Python's sorted(reverse=True)
            order
        }
        _ => identity,
    }
}

fn optimal(sim: &[f64], n: usize) -> Option<Vec<usize>> {
    let d = |i: usize, j: usize| if i == j { 0.0 } else { 1.0 - sim[i * n + j] };
    if (0..n).all(|i| (0..n).all(|j| d(i, j).abs() <= 1e-10)) {
        return None; // no variation, nothing to order
    }
    let mut condensed: Vec<f64> = (0..n).flat_map(|i| (i + 1..n).map(move |j| d(i, j))).collect();
    let dendrogram = linkage(&mut condensed, n, Method::Average);

    // leaves[v] for every tree node: 0..n are leaves, n + s is the node created by merge step s
    let mut leaves: Vec<Vec<usize>> = (0..n).map(|i| vec![i]).collect();
    let mut children = vec![(0, 0); n];
    for step in dendrogram.steps() {
        let (a, b) = (step.cluster1, step.cluster2);
        leaves.push([leaves[a].as_slice(), leaves[b].as_slice()].concat());
        children.push((a, b));
    }

    // Every leaf pair (i, j) has exactly one lowest common ancestor, so one global n×n table holds
    // cost[i][j]: the cheapest ordering of that ancestor's leaves starting at i and ending at j,
    // and via[i][j] the inner leaves (k, m) where that ordering crosses from one child to the other.
    let mut cost = vec![0.0; n * n];
    let mut via = vec![(0, 0); n * n];
    // (leaves an ordering may start from, leaves its other end must come from) for each side of a node
    let halves = |v: usize| -> Vec<(&[usize], &[usize])> {
        if v < n {
            vec![(&leaves[v][..], &leaves[v][..])]
        } else {
            let (a, b) = children[v];
            vec![(&leaves[a][..], &leaves[b][..]), (&leaves[b][..], &leaves[a][..])]
        }
    };
    // ponytail: O(n^4) worst case, fine for a few hundred features; Bar-Joseph's pruning if it ever is not
    for &(l, r) in &children[n..] {
        for (is, ks) in halves(l) {
            for (js, ms) in halves(r) {
                for &i in is {
                    for &j in js {
                        let mut best = (f64::INFINITY, (i, j));
                        for &k in ks {
                            for &m in ms {
                                let c = cost[i * n + k] + d(k, m) + cost[m * n + j];
                                if c < best.0 {
                                    best = (c, (k, m));
                                }
                            }
                        }
                        cost[i * n + j] = best.0;
                        cost[j * n + i] = best.0;
                        via[i * n + j] = best.1;
                        via[j * n + i] = (best.1.1, best.1.0);
                    }
                }
            }
        }
    }

    let (l, r) = children[2 * n - 2];
    let (_, i, j) = leaves[l]
        .iter()
        .flat_map(|&i| leaves[r].iter().map(move |&j| (i, j)))
        .map(|(i, j)| (cost[i * n + j], i, j))
        .min_by(|a, b| a.0.total_cmp(&b.0))?;

    fn unfold(via: &[(usize, usize)], n: usize, i: usize, j: usize, out: &mut Vec<usize>) {
        if i == j {
            out.push(i);
            return;
        }
        let (k, m) = via[i * n + j];
        unfold(via, n, i, k, out);
        unfold(via, n, m, j, out);
    }
    let mut order = Vec::with_capacity(n);
    unfold(&via, n, i, j, &mut order);
    Some(order)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn optimal_puts_similar_items_next_to_each_other() {
        // items 0 and 2 are near-identical, as are 1 and 3
        #[rustfmt::skip]
        let sim = [
            1.0, 0.1, 0.9, 0.2,
            0.1, 1.0, 0.2, 0.9,
            0.9, 0.2, 1.0, 0.1,
            0.2, 0.9, 0.1, 1.0,
        ];
        let order = reorder(&sim, 4, "optimal");
        let mut sorted = order.clone();
        sorted.sort();
        assert_eq!(sorted, vec![0, 1, 2, 3]);
        let pos = |x: usize| order.iter().position(|&o| o == x).unwrap() as i32;
        assert_eq!((pos(0) - pos(2)).abs(), 1);
        assert_eq!((pos(1) - pos(3)).abs(), 1);
    }

    #[test]
    fn constant_matrix_keeps_order() {
        assert_eq!(reorder(&[1.0; 9], 3, "optimal"), vec![0, 1, 2]);
    }
}
