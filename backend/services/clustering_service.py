from typing import Dict, List, Any
import numpy as np
from sklearn.cluster import KMeans, DBSCAN
from models.clustering import KMeansParams, DBScanParams
from typing import Literal

class ClusteringService:
    @staticmethod
    def compute_feature_pairs_clusters(
        data: List[Dict[str, float | str]],
        columns: List[str],
        algorithm: Literal["kmeans", "dbscan"],
        params: KMeansParams | DBScanParams
    ) -> Dict[str, Dict[str, Dict[int, List[int]]]]:
        # Convert data to numpy array
        dataset = np.array([[float(row[col]) for col in columns] for row in data])
        
        results = {}
        
        # Compute clusters for each feature pair
        for i, col1 in enumerate(columns):
            results[col1] = {}
            for j, col2 in enumerate(columns):
                # Skip same feature
                if i >= j:  
                    continue
                    
                # Extract feature pair data
                feature_pair_data = dataset[:, [i, j]]
                
                # Perform k-means clustering
                if algorithm == "kmeans":
                    kmeans = KMeans(
                        n_clusters=params.k, 
                        max_iter=params.max_iterations,
                        n_init='auto'
                    )
                    clusters = kmeans.fit_predict(feature_pair_data)
                elif algorithm == "dbscan":
                    dbscan = DBSCAN(
                        eps=params.eps,
                        min_samples=params.min_samples
                    )
                    clusters = dbscan.fit_predict(feature_pair_data)
                
                # Group data points by cluster
                cluster_groups = {}
                for idx, cluster in enumerate(clusters):
                    if int(cluster) not in cluster_groups:
                        cluster_groups[int(cluster)] = []
                    cluster_groups[int(cluster)].append(idx)
                
                results[col1][col2] = cluster_groups
        
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
        selected_cluster_id: int
    ) -> List[Dict[str, Any]]:
        results = []
        
        # Get the selected cluster's data points
        selected_cluster_points = all_clusters.get(selected_feature1, {})\
            .get(selected_feature2, {})\
            .get(selected_cluster_id, [])
        
        # Compare with all other clusters
        for feat1, feature_pairs in all_clusters.items():
            for feat2, clusters in feature_pairs.items():
                # Skip comparing with itself
                if feat1 == selected_feature1 and feat2 == selected_feature2:
                    continue
                
                for cluster_id, cluster_points in clusters.items():
                    similarity = ClusteringService._calculate_jaccard_index(
                        selected_cluster_points,
                        cluster_points
                    )
                    
                    results.append({
                        "feature1": feat1,
                        "feature2": feat2,
                        "cluster_id": cluster_id,
                        "similarity": similarity
                    })
        
        # Sort by similarity in descending order
        return sorted(results, key=lambda x: x["similarity"], reverse=True)
    
    @staticmethod
    def get_cluster_similarities(
        all_clusters: Dict[str, Dict[str, Dict[int, List[int]]]],
        selected_feature1: str,
        selected_feature2: str,
        selected_cluster_id: int
    ) -> List[Dict[str, Any]]:
        results = []
        
        # both orderings: TODO: restructure to store feature pairs ordered s.t. we dont need to check all permutations if we expand to more than 2 features in the future
        selected_cluster_points = all_clusters.get(selected_feature1, {}).get(selected_feature2, {}).get(selected_cluster_id, [])
        if not selected_cluster_points and selected_feature2 in all_clusters:
            selected_cluster_points = all_clusters.get(selected_feature2, {}).get(selected_feature1, {}).get(selected_cluster_id, [])
        
        if not selected_cluster_points:
            return []  # No matching cluster found
            
        for feat1, feature_pairs in all_clusters.items():
            for feat2, clusters in feature_pairs.items():
                # Skip comparing with itself - check both possible orderings
                if (feat1 == selected_feature1 and feat2 == selected_feature2) or \
                (feat1 == selected_feature2 and feat2 == selected_feature1):
                    continue
                
                for cluster_id, cluster_points in clusters.items():
                    similarity = ClusteringService._calculate_jaccard_index(
                        selected_cluster_points,
                        cluster_points
                    )

                    results.append({
                        "feature1": feat1,
                        "feature2": feat2,
                        "cluster_id": cluster_id,
                        "similarity": similarity
                    })
        
        return sorted(results, key=lambda x: x["similarity"], reverse=True) 