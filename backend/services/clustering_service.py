from typing import Dict, List, Any, Literal, Union
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans, DBSCAN
from scipy.cluster.hierarchy import linkage, optimal_leaf_ordering, leaves_list
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
    def compute_feature_pair_similarity_matrix(
        clusters: Dict[str, Dict[str, Dict[int, List[int]]]],
        selected_feature1: str,
        selected_feature2: str,
        selected_cluster_id: int,
        features: List[str],
        aggregation: str = "max",
        reorder_method: str = "none"
    ) -> Dict[str, Any]:
        """
        Compute a feature-pair similarity matrix for a selected cluster.
        Shows aggregated similarity between the selected cluster and all other clusters
        for each feature pair combination.
        
        Args:
            aggregation: Strategy for aggregating similarities ('max', 'avg', 'min', 'median')
        """
        try:
            # Get the selected cluster data points - handle both orderings
            selected_cluster_points = None
            
            if selected_feature1 in clusters and selected_feature2 in clusters[selected_feature1]:
                selected_cluster_points = clusters[selected_feature1][selected_feature2].get(selected_cluster_id)
            elif selected_feature2 in clusters and selected_feature1 in clusters[selected_feature2]:
                selected_cluster_points = clusters[selected_feature2][selected_feature1].get(selected_cluster_id)
            
            if selected_cluster_points is None:
                raise ValueError(f"Selected cluster {selected_cluster_id} not found for feature pair ({selected_feature1}, {selected_feature2}). Available feature pairs: {list(clusters.keys())}")
            
            # Initialize the matrix
            n_features = len(features)
            similarities = []
            min_similarity = float('inf')
            max_similarity = float('-inf')
            
            # Compute similarities for each feature pair combination
            for i, feature1 in enumerate(features):
                row = []
                for j, feature2 in enumerate(features):
                    if i == j:
                        # Diagonal - self similarity
                        similarity = 1.0
                    else:
                        # Calculate similarities between selected cluster and all clusters of this feature pair
                        similarities_for_pair = []
                        
                        # Check if this feature pair has clusters
                        if feature1 in clusters and feature2 in clusters[feature1]:
                            feature_pair_clusters = clusters[feature1][feature2]
                        elif feature2 in clusters and feature1 in clusters[feature2]:
                            feature_pair_clusters = clusters[feature2][feature1]
                        else:
                            # No clusters found for this feature pair
                            similarity = 0.0
                            row.append(similarity)
                            if similarity < min_similarity:
                                min_similarity = similarity
                            if similarity > max_similarity:
                                max_similarity = similarity
                            continue
                        
                        # Calculate similarity with each cluster in this feature pair
                        for cluster_id, cluster_points in feature_pair_clusters.items():
                            sim = ClusteringService._calculate_jaccard_index(
                                selected_cluster_points, cluster_points
                            )
                            similarities_for_pair.append(sim)
                        
                        # Apply aggregation strategy
                        if not similarities_for_pair:
                            similarity = 0.0
                        elif aggregation == "max":
                            similarity = max(similarities_for_pair)
                        elif aggregation == "avg":
                            similarity = sum(similarities_for_pair) / len(similarities_for_pair)
                        elif aggregation == "min":
                            similarity = min(similarities_for_pair)
                        elif aggregation == "median":
                            sorted_sims = sorted(similarities_for_pair)
                            n = len(sorted_sims)
                            if n % 2 == 0:
                                similarity = (sorted_sims[n//2 - 1] + sorted_sims[n//2]) / 2
                            else:
                                similarity = sorted_sims[n//2]
                        else:
                            # Default to max if unknown aggregation method
                            similarity = max(similarities_for_pair)
                    
                    row.append(similarity)
                    if i != j:  # Ignore self-similarity for min/max calculation
                        if similarity < min_similarity:
                            min_similarity = similarity
                        if similarity > max_similarity:
                            max_similarity = similarity
                
                similarities.append(row)
            
            # Handle edge case where all similarities are diagonal
            if min_similarity == float('inf'):
                min_similarity = 0.0
            if max_similarity == float('-inf'):
                max_similarity = 1.0
            
            # Create the base result
            result = {
                "features": features,
                "similarities": similarities,
                "stats": {
                    "min_similarity": min_similarity,
                    "max_similarity": max_similarity,
                    "size": n_features
                }
            }
            
            # Apply reordering if requested
            if reorder_method != "none":
                logger.info(f"Applying reordering with method: {reorder_method}")
                logger.info(f"Matrix before reordering - features: {features}")
                logger.info(f"Matrix before reordering - stats: min={min_similarity:.4f}, max={max_similarity:.4f}")
                
                reordered_data = ClusteringService.reorder_feature_pair_matrix(
                    similarities, features, reorder_method
                )
                
                logger.info(f"Reordering completed. Order changed: {reordered_data['order'] != list(range(len(features)))}")
                
                result.update({
                    "features": reordered_data["features"],
                    "similarities": reordered_data["similarities"],
                    "reorder_info": {
                        "method": reordered_data["method"],
                        "order": reordered_data["order"],
                        "error": reordered_data.get("error"),
                        "warning": reordered_data.get("warning")
                    }
                })
            else:
                logger.info("No reordering requested (method=none)")
            
            return result
            
        except Exception as e:
            logger.error(f"Error computing feature pair similarity matrix: {str(e)}")
            raise

    @staticmethod
    def reorder_feature_pair_matrix(
        similarities: List[List[float]], 
        features: List[str], 
        method: str = "optimal"
    ) -> Dict[str, Any]:
        """
        Reorder feature pair similarity matrix using hierarchical clustering with optimal leaf ordering.
        Uses the current aggregated similarity values (max, min, avg, median) for reordering.
        
        Args:
            similarities: The aggregated similarity matrix (from feature pair computation)
            features: List of feature names
            method: Reordering method ('optimal', 'average', 'none')
        
        Returns:
            Dictionary with reordered features, similarities, and ordering information
        """
        try:
            logger.info(f"Starting matrix reordering with method '{method}' for {len(features)} features")
            
            n = len(features)
            if n <= 2 or method == "none":
                logger.info(f"Skipping reordering: n={n}, method={method}")
                return {
                    "features": features,
                    "similarities": similarities,
                    "order": list(range(n)),
                    "method": method
                }
            
            # Convert to numpy array for easier manipulation
            sim_matrix = np.array(similarities, dtype=float)
            logger.info(f"Similarity matrix shape: {sim_matrix.shape}")
            logger.info(f"Similarity matrix stats - min: {sim_matrix.min():.4f}, max: {sim_matrix.max():.4f}")
            
            if method == "optimal":
                # Convert similarity matrix to distance matrix (1 - similarity)
                distance_matrix = 1.0 - sim_matrix
                
                # Ensure diagonal is 0 (distance from feature to itself)
                np.fill_diagonal(distance_matrix, 0.0)
                
                logger.info(f"Distance matrix stats - min: {distance_matrix.min():.4f}, max: {distance_matrix.max():.4f}")
                
                # Check if distance matrix has any variation
                if np.allclose(distance_matrix, distance_matrix[0, 0], atol=1e-10):
                    logger.warning("Distance matrix has no variation - all distances are identical. Skipping reordering.")
                    return {
                        "features": features,
                        "similarities": similarities,
                        "order": list(range(n)),
                        "method": method,
                        "warning": "No variation in distance matrix"
                    }
                
                # Convert to condensed distance matrix format required by linkage
                condensed_distances = squareform(distance_matrix, checks=False)
                logger.info(f"Condensed distances shape: {condensed_distances.shape}, unique values: {len(np.unique(condensed_distances))}")
                
                # Perform hierarchical clustering using average linkage
                linkage_matrix = linkage(condensed_distances, method='average')
                logger.info(f"Linkage matrix shape: {linkage_matrix.shape}")
                
                # Use optimal leaf ordering to minimize distance between adjacent leaves
                optimal_linkage = optimal_leaf_ordering(linkage_matrix, condensed_distances)
                order = leaves_list(optimal_linkage).tolist()
                
                logger.info(f"Original order: {list(range(n))}")
                logger.info(f"Optimal order: {order}")
                logger.info(f"Order changed: {order != list(range(n))}")
                
            elif method == "average":
                # Simple ordering by average similarity (highest first)
                avg_similarities = [
                    sum(sim_matrix[i][j] for j in range(n) if i != j) / (n - 1) if n > 1 else 0
                    for i in range(n)
                ]
                order = sorted(range(n), key=lambda i: avg_similarities[i], reverse=True)
                logger.info(f"Average similarities: {avg_similarities}")
                logger.info(f"Sorted order by average: {order}")
                
            else:
                # Default: no reordering
                order = list(range(n))
            
            # Apply reordering to both features and similarities matrix
            reordered_features = [features[i] for i in order]
            reordered_similarities = [
                [sim_matrix[i][j] for j in order]
                for i in order
            ]
            
            logger.info(f"Original features: {features}")
            logger.info(f"Reordered features: {reordered_features}")
            logger.info(f"Features changed: {features != reordered_features}")
            
            return {
                "features": reordered_features,
                "similarities": reordered_similarities,
                "order": order,
                "method": method
            }
            
        except Exception as e:
            logger.error(f"Error reordering feature pair matrix: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            # Return original data if reordering fails
            return {
                "features": features,
                "similarities": similarities,
                "order": list(range(len(features))),
                "method": "none",
                "error": str(e)
            }
