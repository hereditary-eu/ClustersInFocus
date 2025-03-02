# clustering ops namespace

from fastapi import APIRouter, HTTPException, Query
from utils import get_logger
from models.clustering import (
    ClusteringRequest,
    ClusteringResult,
    SimilarityRequest,
    ClusterSimilarity
)
from services.clustering_service import ClusteringService
from typing import List, Dict, Optional
from database import temp_database


logger = get_logger(__name__)
clustering_router = APIRouter(prefix="/clustering", tags=["clustering"])

# Initialize clusters in temp_database if not already present
if "clusters" not in temp_database:
    temp_database["clusters"] = {}
if "data" not in temp_database:
    temp_database["data"] = {}

@clustering_router.post("/compute", response_model=List[ClusteringResult])
async def compute_clusters(request: ClusteringRequest):
    try:
        # store the original data in the database
        temp_database["data"] = request.data

        results = ClusteringService.compute_feature_pairs_clusters(
            data=request.data, #the entire csv?
            columns=request.columns, #the columns to cluster (exactly 2 for now)
            algorithm=request.algorithm,
            params=request.params
        )

        temp_database["clusters"] = results
        formatted_results = []
        for feat1, feature_pairs in results.items():
            for feat2, clusters in feature_pairs.items():
                formatted_results.append(ClusteringResult(
                    feature1=feat1,
                    feature2=feat2,
                    clusters=clusters
                ))
        
        return formatted_results
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@clustering_router.get("/get_all_clustered_feature_pairs", response_model=List[ClusteringResult])
async def get_all_clustered_feature_pairs():
    clusters = temp_database.get("clusters", {})
    if not clusters:
        return []
    
    formatted_results = []
    for feat1, feature_pairs in clusters.items():
        for feat2, clusters in feature_pairs.items():
            formatted_results.append(ClusteringResult(
                feature1=feat1,
                feature2=feat2,
                clusters=clusters
            ))
    
    return formatted_results

@clustering_router.post("/similarities", response_model=List[ClusterSimilarity])
async def get_similarities(request: SimilarityRequest):
    try:
        clusters = temp_database.get("clusters", {})
        if not clusters:
            raise HTTPException(
                status_code=400, 
                detail="No clusters found. Please compute clusters first."
            )
        
        similarities = ClusteringService.get_cluster_similarities(
            all_clusters=clusters,
            selected_feature1=request.selected_feature1,
            selected_feature2=request.selected_feature2,
            selected_cluster_id=request.selected_cluster_id
        )
        
        return [ClusterSimilarity(**sim) for sim in similarities]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@clustering_router.get("/get_by_features")
async def get_clusters_by_features(
    feature1: str = Query(..., description="First feature name"),
    feature2: str = Query(..., description="Second feature name")
) -> Optional[Dict[int, List[int]]]:
    """
    Get clusters for a specific feature pair.
    Returns a dictionary mapping cluster IDs to lists of data point indices.
    """
    try:
        clusters = temp_database.get("clusters", {})
        if not clusters:
            return None
        
        # Try both orderings of the features since we don't know which was used as the key
        if feature1 in clusters and feature2 in clusters[feature1]:
            return clusters[feature1][feature2]
        elif feature2 in clusters and feature1 in clusters[feature2]:
            return clusters[feature2][feature1]
        
        return None
    
    except Exception as e:
        logger.error(f"Error retrieving clusters: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
