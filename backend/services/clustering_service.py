from typing import Dict, List, Any, Literal, Union
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans, DBSCAN
from scipy.cluster.hierarchy import linkage, fcluster
from scipy.spatial.distance import squareform
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


    @staticmethod
    def compute_similarity_matrix(
        all_clusters: Dict[str, Dict[str, Dict[int, List[int]]]]
    ) -> Dict[str, Any]:
        """
        Compute a comprehensive similarity matrix for all clusters of all feature pairs.
        Returns optimized data structure for matrix visualization.
        """
        # Create a list of all cluster identifiers (feature_pair, cluster_id)
        cluster_identifiers = []
        cluster_points_map = {}
        
        for feat1, feature_pairs in all_clusters.items():
            for feat2, clusters in feature_pairs.items():
                for cluster_id, cluster_points in clusters.items():
                    identifier = f"{feat1}_{feat2}_{cluster_id}"
                    cluster_identifiers.append({
                        "id": identifier,
                        "feature1": feat1,
                        "feature2": feat2,
                        "cluster_id": cluster_id,
                        "display_name": f"{feat1} & {feat2} (C{cluster_id})"
                    })
                    cluster_points_map[identifier] = cluster_points
        
        # Compute similarity matrix
        n = len(cluster_identifiers)
        similarities = []
        min_similarity = 1.0
        max_similarity = 0.0
        
        for i in range(n):
            row = []
            for j in range(n):
                if i == j:
                    similarity = 1.0  # Self-similarity
                else:
                    # Compute similarity between clusters (filtering already applied above if needed)
                    cluster1_points = cluster_points_map[cluster_identifiers[i]["id"]]
                    cluster2_points = cluster_points_map[cluster_identifiers[j]["id"]]
                    similarity = ClusteringService._calculate_jaccard_index(cluster1_points, cluster2_points)
                
                row.append(similarity)
                if i != j:  # Ignore self-similarity for min/max calculation
                    min_similarity = min(min_similarity, similarity)
                    max_similarity = max(max_similarity, similarity)
            
            similarities.append(row)
        
        return {
            "cluster_identifiers": cluster_identifiers,
            "similarities": similarities,
            "stats": {
                "min_similarity": min_similarity,
                "max_similarity": max_similarity,
                "size": n
            }
        }

    @staticmethod
    def reorder_similarity_matrix(
        matrix_data: Dict[str, Any], 
        linkage_method: str = "average"
    ) -> Dict[str, Any]:
        """
        Reorder similarity matrix using agglomerative clustering.
        Returns the matrix with reordered rows/columns to group similar clusters together.
        """
        try:
            similarities = matrix_data["similarities"]
            cluster_identifiers = matrix_data["cluster_identifiers"]
            n = len(similarities)
            
            if n <= 1:
                return matrix_data  # Cannot cluster single item
            
            # Convert similarity matrix to distance matrix (1 - similarity)
            distance_matrix = np.zeros((n, n))
            for i in range(n):
                for j in range(n):
                    if i != j:
                        distance_matrix[i][j] = 1.0 - similarities[i][j]
                    else:
                        distance_matrix[i][j] = 0.0
            
            # Convert to condensed distance matrix for linkage
            condensed_distances = squareform(distance_matrix, checks=False)
            
            # Perform hierarchical clustering
            linkage_matrix = linkage(condensed_distances, method=linkage_method)
            
            # Get the optimal leaf ordering (dendrogram order)
            from scipy.cluster.hierarchy import leaves_list
            optimal_order = leaves_list(linkage_matrix)
            
            # Reorder the similarity matrix and cluster identifiers
            reordered_similarities = []
            reordered_identifiers = []
            
            for i in optimal_order:
                reordered_identifiers.append(cluster_identifiers[i])
                reordered_row = []
                for j in optimal_order:
                    reordered_row.append(similarities[i][j])
                reordered_similarities.append(reordered_row)
            
            return {
                "cluster_identifiers": reordered_identifiers,
                "similarities": reordered_similarities,
                "stats": matrix_data["stats"],
                "reorder_indices": optimal_order.tolist(),
                "linkage_method": linkage_method
            }
            
        except Exception as e:
            logger.error(f"Error reordering similarity matrix: {str(e)}")
            # Return original matrix if reordering fails
            return matrix_data
