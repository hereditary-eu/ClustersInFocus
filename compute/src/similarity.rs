use std::collections::BTreeMap;

/// Jaccard index of the selected cluster (`selected`, `size` members) against every cluster in `labels`,
/// as (label, similarity) sorted by label. One pass: |A ∪ S| = |A| + |S| - |A ∩ S|.
pub fn jaccard_by_label(selected: &[bool], size: usize, labels: &[i32]) -> Vec<(i32, f64)> {
    let mut counts: BTreeMap<i32, (usize, usize)> = BTreeMap::new();
    for (&l, &s) in labels.iter().zip(selected) {
        let c = counts.entry(l).or_default();
        c.0 += 1;
        c.1 += s as usize;
    }
    counts.into_iter().map(|(l, (a, both))| (l, both as f64 / (a + size - both) as f64)).collect()
}

/// Aggregate the similarities of one feature pair; unknown names fall back to "max" like the Python backend.
pub fn aggregate(sims: &[f64], how: &str) -> f64 {
    if sims.is_empty() {
        return 0.0;
    }
    let n = sims.len();
    if how == "avg" {
        return sims.iter().sum::<f64>() / n as f64;
    }
    let mut s = sims.to_vec();
    s.sort_by(f64::total_cmp);
    match how {
        "min" => s[0],
        "median" if n.is_multiple_of(2) => (s[n / 2 - 1] + s[n / 2]) / 2.0,
        "median" => s[n / 2],
        _ => s[n - 1],
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn jaccard_counts() {
        let labels = [0, 0, 1, 1, -1];
        let selected = [true, true, true, false, false];
        assert_eq!(jaccard_by_label(&selected, 3, &labels), vec![(-1, 0.0), (0, 2.0 / 3.0), (1, 0.25)]);
    }

    #[test]
    fn aggregations() {
        let s = [0.2, 0.8, 0.4, 0.6];
        assert_eq!(aggregate(&s, "max"), 0.8);
        assert_eq!(aggregate(&s, "min"), 0.2);
        assert_eq!(aggregate(&s, "median"), 0.5);
        assert!((aggregate(&s, "avg") - 0.5).abs() < 1e-12);
        assert_eq!(aggregate(&[], "max"), 0.0);
    }
}
