"""Parity tests: the Rust/wasm compute crate (compute/) against the original Python implementation.

Run from the repository root with `uv run pytest`; needs cargo.
"""

import itertools
import json
import subprocess
from pathlib import Path
from types import SimpleNamespace

import numpy as np
import pandas as pd
import pytest
from clustering_service import ClusteringService
from scipy.cluster.hierarchy import linkage
from scipy.spatial.distance import squareform
from scipy.stats import spearmanr
from shapley_service import ShapleyService
from sklearn.metrics import adjusted_rand_score

ROOT = Path(__file__).resolve().parents[1]
DATA = pd.read_csv(ROOT / "frontend/public/parkinsonsdata.csv").select_dtypes("number")
FEATURES = list(DATA.columns)
N = len(FEATURES)
PAIRS = [(i, j) for i in range(N) for j in range(i + 1, N)]


def rust(*requests):
    payload = {
        "data": DATA.to_numpy().T.ravel().tolist(),
        "n_rows": len(DATA),
        "n_cols": N,
        "requests": list(requests),
    }
    out = subprocess.run(
        ["cargo", "run", "--release", "--quiet", "--example", "parity"],
        cwd=ROOT / "compute",
        input=json.dumps(payload),
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(out.stdout)


def python_labels(algorithm, params):
    clusters = ClusteringService.compute_feature_pairs_clusters(
        DATA.to_dict("records"), FEATURES, algorithm, SimpleNamespace(**params)
    )
    return [to_array(clusters[FEATURES[i]][FEATURES[j]]) for i, j in PAIRS]


def to_array(groups):
    labels = np.full(len(DATA), -1)
    for label, rows in groups.items():
        labels[rows] = label
    return labels


def to_clusters(labels):
    """Rust labels per pair -> the nested dict the Python functions take."""
    clusters = {f: {} for f in FEATURES}
    for (i, j), ls in zip(PAIRS, labels):
        ls = np.asarray(ls)
        clusters[FEATURES[i]][FEATURES[j]] = {int(l): np.flatnonzero(ls == l).tolist() for l in np.unique(ls)}
    return clusters


@pytest.fixture(scope="module")
def dbscan_labels():
    return rust({"op": "dbscan", "eps": 5.0, "min_samples": 2}, {"op": "labels"})[1]


@pytest.mark.parametrize("eps,min_samples", [(0.5, 2), (5.0, 2), (5.0, 5)])
def test_dbscan_matches_exactly(eps, min_samples):
    ours = rust({"op": "dbscan", "eps": eps, "min_samples": min_samples}, {"op": "labels"})[1]
    theirs = python_labels("dbscan", {"eps": eps, "min_samples": min_samples})
    for pair, a, b in zip(PAIRS, ours, theirs):
        assert np.array_equal(a, b), pair


def inertia(labels, i, j):
    points = DATA.iloc[:, [i, j]].to_numpy()
    return sum(((points[labels == l] - points[labels == l].mean(0)) ** 2).sum() for l in np.unique(labels))


def test_kmeans_finds_the_same_partitions():
    # different random starts, so compare partitions and their quality rather than labels
    ours = rust({"op": "kmeans", "k": 3, "max_iter": 1000}, {"op": "labels"})[1]
    theirs = python_labels("kmeans", {"k": 3, "max_iterations": 1000})
    ari = [adjusted_rand_score(a, b) for a, b in zip(ours, theirs)]
    assert np.median(ari) > 0.95, np.percentile(ari, [5, 50])
    assert np.mean(ari) > 0.85, np.mean(ari)
    ratio = np.array([inertia(np.array(a), i, j) / inertia(b, i, j) for (i, j), a, b in zip(PAIRS, ours, theirs)])
    assert np.median(ratio) <= 1 + 1e-9 and ratio.max() < 1.1, (np.median(ratio), ratio.max())


SELECTIONS = [(0, 1, 0), (0, 1, -1), (0, 1, 7), (3, 7, 0), (16, 22, 0)]  # (0, 1) has 22 clusters and noise


@pytest.mark.parametrize("i,j,label", SELECTIONS)
def test_similarities_match(dbscan_labels, i, j, label):
    ours = rust({"op": "dbscan", "eps": 5.0, "min_samples": 2}, {"op": "similarities", "i": i, "j": j, "label": label})[
        1
    ]
    ours = sorted(
        (FEATURES[int(a)], FEATURES[int(b)], int(l), round(s, 12)) for a, b, l, s in np.reshape(ours, (-1, 4))
    )
    theirs = ClusteringService.get_cluster_similarities(to_clusters(dbscan_labels), FEATURES[i], FEATURES[j], label)
    theirs = sorted((t["feature1"], t["feature2"], t["cluster_id"], round(t["similarity"], 12)) for t in theirs)
    assert ours == theirs


@pytest.mark.parametrize("aggregation", ["max", "avg", "min", "median"])
@pytest.mark.parametrize("i,j,label", SELECTIONS)
def test_matrix_matches(dbscan_labels, i, j, label, aggregation):
    ours = rust(
        {"op": "dbscan", "eps": 5.0, "min_samples": 2},
        {"op": "matrix", "i": i, "j": j, "label": label, "aggregation": aggregation},
    )[1]
    theirs = ClusteringService.compute_feature_pair_similarity_matrix(
        to_clusters(dbscan_labels), FEATURES[i], FEATURES[j], label, FEATURES, aggregation
    )["similarities"]
    np.testing.assert_allclose(np.reshape(ours, (N, N)), theirs, atol=1e-12)


def path_cost(sim, order):
    return sum(1 - sim[a][b] for a, b in zip(order, order[1:]))


def brute_force_optimum(sim):
    """Cheapest leaf order over all 2^(n-1) child flips of scipy's average-linkage tree."""
    n = len(sim)
    dist = 1 - sim
    np.fill_diagonal(dist, 0)
    children = {
        n + k: (int(a), int(b)) for k, (a, b, _, _) in enumerate(linkage(squareform(dist, checks=False), "average"))
    }

    def leaves(v, flips):
        if v < n:
            return [v]
        left, right = (leaves(c, flips) for c in children[v])
        return right + left if flips[v - n] else left + right

    return min(path_cost(sim, leaves(2 * n - 2, f)) for f in itertools.product([0, 1], repeat=n - 1))


@pytest.mark.parametrize("seed", range(5))
def test_reorder_matches(seed):
    rng = np.random.default_rng(seed)
    n = 12
    sim = rng.random((n, n))
    sim = (sim + sim.T) / 2
    np.fill_diagonal(sim, 1)
    for method in ["optimal", "average", "none"]:
        ours = rust({"op": "reorder", "matrix": sim.ravel().tolist(), "n": n, "method": method})[0]
        theirs = ClusteringService.reorder_feature_pair_matrix(sim.tolist(), list(range(n)), method)["order"]
        if method == "optimal":
            # scipy's optimal_leaf_ordering misses the optimum on some of these, so check against brute force
            assert sorted(ours) == list(range(n))
            assert path_cost(sim, ours) == pytest.approx(brute_force_optimum(sim), abs=1e-9)
            assert path_cost(sim, ours) <= path_cost(sim, theirs) + 1e-9
        else:
            assert ours == theirs


@pytest.mark.parametrize("target", ["status", "MDVP:Fo(Hz)", "PPE"])
def test_shap_ranks_features_alike(target):
    # a hand-written forest is not xgboost: same model family and hyperparameters, so close but not equal
    ours = pd.Series(rust({"op": "shap", "target": FEATURES.index(target)})[0], index=FEATURES).drop(target)
    theirs = ShapleyService.compute_shapley_values_from_df(DATA, target).set_index("feature")["SHAP Value"]
    theirs = theirs[ours.index]
    assert spearmanr(ours, theirs).statistic > 0.8
    assert len(set(ours.nlargest(5).index) & set(theirs.nlargest(5).index)) >= 3
    assert 0.67 < ours.sum() / theirs.sum() < 1.5
