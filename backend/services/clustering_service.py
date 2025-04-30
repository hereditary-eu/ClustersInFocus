from typing import Dict, List, Any, Literal, Union
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans, DBSCAN
from models.clustering import KMeansParams, DBScanParams
from utils.logger import get_logger

logger = get_logger(__name__)


class ClusteringService:
    @staticmethod
    def compute_feature_pairs_clusters(
        data: List[Dict[str, Union[float, str, None]]],
        columns: List[str],
        algorithm: Literal["kmeans", "dbscan"],
        params: KMeansParams | DBScanParams,
    ) -> Dict[str, Dict[str, Dict[int, List[int]]]]:
        """
        Compute clusters for each feature pair.
        Uses pandas DataFrame for more robust data handling.
        """
        logger.info(f"Computing clusters for {len(data)} data points with {len(columns)} columns")

        if not isinstance(data, pd.DataFrame):
            df = pd.DataFrame(data)
        else:
            df = data

        missing_columns = [col for col in columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"Columns not found in dataset: {missing_columns}")

        df_numeric = df[columns].apply(pd.to_numeric, errors="coerce")

        # Handle any remaining NaN values by replacing with column means
        for col in df_numeric.columns:
            if df_numeric[col].isna().any():
                mean_val = df_numeric[col].mean()
                if pd.isna(mean_val):  # All values are NaN
                    df_numeric[col] = df_numeric[col].fillna(0)
                else:
                    df_numeric[col] = df_numeric[col].fillna(mean_val)

        # Get numpy array for clustering
        dataset = df_numeric.values

        results = {}

        for i, col1 in enumerate(columns):
            results[col1] = {}
            for j, col2 in enumerate(columns):
                # Skip same feature
                if i >= j:
                    continue

                feature_pair_data = dataset[:, [i, j]]

                # Skip if data contains NaN: Sanity check only - this should not happen due to our preprocessing
                if np.isnan(feature_pair_data).any():
                    logger.warning(f"Skipping {col1} and {col2} due to NaN values")
                    continue

                try:
                    if algorithm == "kmeans":
                        kmeans = KMeans(n_clusters=params.k, max_iter=params.max_iterations, n_init="auto")
                        clusters = kmeans.fit_predict(feature_pair_data)
                    elif algorithm == "dbscan":
                        dbscan = DBSCAN(eps=params.eps, min_samples=params.min_samples)
                        clusters = dbscan.fit_predict(feature_pair_data)

                    cluster_groups = {}
                    for idx, cluster in enumerate(clusters):
                        cluster_label = int(cluster)
                        if cluster_label not in cluster_groups:
                            cluster_groups[cluster_label] = []
                        cluster_groups[cluster_label].append(idx)

                    results[col1][col2] = cluster_groups

                except Exception as e:
                    logger.error(f"Error clustering {col1} and {col2}: {str(e)}")
                    # Continue with other feature pairs instead of failing completely
                    continue

        return results

    @staticmethod
    def _calculate_jaccard_index(set1: List[int], set2: List[int]) -> float:
        intersection = len(set(set1) & set(set2))
        union = len(set(set1) | set(set2))
        return intersection / union if union > 0 else 0.0

    @staticmethod
    def get_cluster_similarities(
        all_clusters: Dict[str, Dict[str, Dict[int, List[int]]]],
        selected_feature1: str,
        selected_feature2: str,
        selected_cluster_id: int,
    ) -> List[Dict[str, Any]]:
        results = []

        selected_cluster_points = (
            all_clusters.get(selected_feature1, {}).get(selected_feature2, {}).get(selected_cluster_id, [])
        )

        # Compare with all other clusters
        for feat1, feature_pairs in all_clusters.items():
            for feat2, clusters in feature_pairs.items():
                # Skip comparing with itself
                if (feat1 == selected_feature1 and feat2 == selected_feature2) or (
                    feat1 == selected_feature2 and feat2 == selected_feature1
                ):
                    continue

                for cluster_id, cluster_points in clusters.items():
                    similarity = ClusteringService._calculate_jaccard_index(selected_cluster_points, cluster_points)

                    results.append(
                        {"feature1": feat1, "feature2": feat2, "cluster_id": cluster_id, "similarity": similarity}
                    )

        # Sort by similarity in descending order
        return sorted(results, key=lambda x: x["similarity"], reverse=True)

    @staticmethod
    def get_cluster_similarities(
        all_clusters: Dict[str, Dict[str, Dict[int, List[int]]]],
        selected_feature1: str,
        selected_feature2: str,
        selected_cluster_id: int,
    ) -> List[Dict[str, Any]]:
        results = []

        # both orderings: TODO: restructure to store feature pairs ordered s.t. we dont need to check all permutations if we expand to more than 2 features in the future
        selected_cluster_points = (
            all_clusters.get(selected_feature1, {}).get(selected_feature2, {}).get(selected_cluster_id, [])
        )
        if not selected_cluster_points and selected_feature2 in all_clusters:
            selected_cluster_points = (
                all_clusters.get(selected_feature2, {}).get(selected_feature1, {}).get(selected_cluster_id, [])
            )

        if not selected_cluster_points:
            return []  # No matching cluster found

        for feat1, feature_pairs in all_clusters.items():
            for feat2, clusters in feature_pairs.items():
                # Skip comparing with itself - check both possible orderings
                if (feat1 == selected_feature1 and feat2 == selected_feature2) or (
                    feat1 == selected_feature2 and feat2 == selected_feature1
                ):
                    continue

                for cluster_id, cluster_points in clusters.items():
                    similarity = ClusteringService._calculate_jaccard_index(selected_cluster_points, cluster_points)

                    results.append(
                        {"feature1": feat1, "feature2": feat2, "cluster_id": cluster_id, "similarity": similarity}
                    )

        return sorted(results, key=lambda x: x["similarity"], reverse=True)
