//! All Clusters in Focus computation, compiled to wasm and run in a Web Worker so data never leaves the browser.

use wasm_bindgen::prelude::*;

mod cluster;
mod order;
mod rng;
mod shap;
mod similarity;

use rng::Rng;

const SEED: u64 = 42;

/// A dataset's numeric columns plus the clustering of every column pair, kept in wasm memory.
/// Pairs are (i, j) column indices; either order works.
#[wasm_bindgen]
pub struct Workspace {
    n_rows: usize,
    n_cols: usize,
    data: Vec<f64>,
    /// one label per row for each pair i < j, in row-major pair order; empty until clustered
    labels: Vec<Vec<i32>>,
}

#[wasm_bindgen]
impl Workspace {
    /// `data` is column-major; NaN marks a missing value, which is replaced by the column mean (0 if all missing).
    #[wasm_bindgen(constructor)]
    pub fn new(mut data: Vec<f64>, n_rows: usize, n_cols: usize) -> Result<Workspace, String> {
        if data.len() != n_rows * n_cols {
            return Err(format!("expected {n_rows}×{n_cols} values, got {}", data.len()));
        }
        for col in data.chunks_mut(n_rows.max(1)) {
            let known: Vec<f64> = col.iter().copied().filter(|v| v.is_finite()).collect();
            let mean = if known.is_empty() { 0.0 } else { known.iter().sum::<f64>() / known.len() as f64 };
            col.iter_mut().filter(|v| !v.is_finite()).for_each(|v| *v = mean);
        }
        Ok(Workspace { n_rows, n_cols, data, labels: vec![] })
    }

    pub fn kmeans(&mut self, k: usize, max_iter: usize) {
        let mut rng = Rng::new(SEED);
        self.labels =
            self.pairs().map(|(i, j)| cluster::kmeans(self.col(i), self.col(j), k, max_iter, &mut rng)).collect();
    }

    pub fn dbscan(&mut self, eps: f64, min_samples: usize) {
        self.labels = self.pairs().map(|(i, j)| cluster::dbscan(self.col(i), self.col(j), eps, min_samples)).collect();
    }

    #[wasm_bindgen(js_name = hasClusters)]
    pub fn has_clusters(&self) -> bool {
        !self.labels.is_empty()
    }

    /// Cluster label of every row for pair (i, j); -1 is DBSCAN noise.
    pub fn labels(&self, i: usize, j: usize) -> Result<Vec<i32>, String> {
        Ok(self.pair_labels(i, j)?.to_vec())
    }

    /// Jaccard similarity of cluster `label` of pair (i, j) to every cluster of every other pair,
    /// flattened as [i, j, label, similarity, ...] and sorted by similarity, highest first.
    pub fn similarities(&self, i: usize, j: usize, label: i32) -> Result<Vec<f64>, String> {
        let (selected, size) = self.selection(i, j, label)?;
        let mut out: Vec<(usize, usize, i32, f64)> = vec![];
        for (p, (a, b)) in self.pairs().enumerate() {
            if (a, b) != (i.min(j), i.max(j)) {
                let sims = similarity::jaccard_by_label(&selected, size, &self.labels[p]);
                out.extend(sims.into_iter().map(|(l, s)| (a, b, l, s)));
            }
        }
        out.sort_by(|x, y| y.3.total_cmp(&x.3));
        Ok(out.into_iter().flat_map(|(a, b, l, s)| [a as f64, b as f64, l as f64, s]).collect())
    }

    /// n_cols×n_cols row-major matrix: entry (a, b) aggregates the similarities of cluster `label` of
    /// pair (i, j) to all clusters of pair (a, b) with `aggregation` (max, avg, min, median); the diagonal is 1.
    pub fn matrix(&self, i: usize, j: usize, label: i32, aggregation: &str) -> Result<Vec<f64>, String> {
        let (selected, size) = self.selection(i, j, label)?;
        let n = self.n_cols;
        let mut m = vec![1.0; n * n];
        for (p, (a, b)) in self.pairs().enumerate() {
            let sims: Vec<f64> =
                similarity::jaccard_by_label(&selected, size, &self.labels[p]).into_iter().map(|(_, s)| s).collect();
            let v = similarity::aggregate(&sims, aggregation);
            m[a * n + b] = v;
            m[b * n + a] = v;
        }
        Ok(m)
    }

    /// Mean |SHAP| per column of a random forest predicting column `target` from the others (0 for the target).
    pub fn shap(&self, target: usize) -> Result<Vec<f64>, String> {
        if target >= self.n_cols {
            return Err(format!("no column {target}"));
        }
        if self.n_cols < 2 {
            return Err("No numerical columns found in the dataset".into());
        }
        Ok(shap::importance(&self.data, self.n_rows, target, &mut Rng::new(SEED)))
    }
}

/// Order for the rows/columns of a symmetric n×n similarity matrix: "optimal", "average" or "none".
#[wasm_bindgen]
pub fn reorder(matrix: Vec<f64>, n: usize, method: &str) -> Vec<u32> {
    order::reorder(&matrix, n, method).into_iter().map(|i| i as u32).collect()
}

impl Workspace {
    fn col(&self, c: usize) -> &[f64] {
        &self.data[c * self.n_rows..(c + 1) * self.n_rows]
    }

    fn pairs(&self) -> impl Iterator<Item = (usize, usize)> + use<> {
        let n = self.n_cols;
        (0..n).flat_map(move |i| (i + 1..n).map(move |j| (i, j)))
    }

    fn pair_labels(&self, i: usize, j: usize) -> Result<&[i32], String> {
        let (a, b) = (i.min(j), i.max(j));
        if a == b || b >= self.n_cols {
            return Err(format!("no feature pair ({i}, {j})"));
        }
        if self.labels.is_empty() {
            return Err("No clusters found. Please compute clusters first.".into());
        }
        Ok(&self.labels[a * self.n_cols - a * (a + 1) / 2 + (b - a - 1)])
    }

    fn selection(&self, i: usize, j: usize, label: i32) -> Result<(Vec<bool>, usize), String> {
        let selected: Vec<bool> = self.pair_labels(i, j)?.iter().map(|&l| l == label).collect();
        let size = selected.iter().filter(|&&s| s).count();
        if size == 0 {
            return Err(format!("Selected cluster {label} not found for feature pair ({i}, {j})"));
        }
        Ok((selected, size))
    }
}
