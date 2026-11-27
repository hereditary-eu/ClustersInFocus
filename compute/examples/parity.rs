//! Native entry point for reference/test_parity.py: reads a dataset and a list of requests as JSON on stdin,
//! runs them on one Workspace and prints the results as a JSON list.

use cif_compute::{Workspace, reorder};
use serde_json::{Value, json};

fn main() {
    let input: Value = serde_json::from_reader(std::io::stdin()).expect("JSON on stdin");
    let n_rows = input["n_rows"].as_u64().unwrap() as usize;
    let n_cols = input["n_cols"].as_u64().unwrap() as usize;
    let data = input["data"].as_array().unwrap().iter().map(|v| v.as_f64().unwrap_or(f64::NAN)).collect();
    let mut ws = Workspace::new(data, n_rows, n_cols).unwrap();

    let int = |r: &Value, k: &str| r[k].as_i64().unwrap();
    let results: Vec<Value> = input["requests"]
        .as_array()
        .unwrap()
        .iter()
        .map(|r| match r["op"].as_str().unwrap() {
            "kmeans" => json!(ws.kmeans(int(r, "k") as usize, int(r, "max_iter") as usize)),
            "dbscan" => json!(ws.dbscan(r["eps"].as_f64().unwrap(), int(r, "min_samples") as usize)),
            "labels" => {
                let pairs = (0..n_cols).flat_map(|i| (i + 1..n_cols).map(move |j| (i, j)));
                json!(pairs.map(|(i, j)| ws.labels(i, j).unwrap()).collect::<Vec<_>>())
            }
            "similarities" => {
                json!(ws.similarities(int(r, "i") as usize, int(r, "j") as usize, int(r, "label") as i32).unwrap())
            }
            "matrix" => json!(
                ws.matrix(
                    int(r, "i") as usize,
                    int(r, "j") as usize,
                    int(r, "label") as i32,
                    r["aggregation"].as_str().unwrap()
                )
                .unwrap()
            ),
            "reorder" => {
                let m: Vec<f64> = r["matrix"].as_array().unwrap().iter().map(|v| v.as_f64().unwrap()).collect();
                json!(reorder(m, int(r, "n") as usize, r["method"].as_str().unwrap()))
            }
            "shap" => json!(ws.shap(int(r, "target") as usize).unwrap()),
            op => panic!("unknown op {op}"),
        })
        .collect();
    println!("{}", json!(results));
}
