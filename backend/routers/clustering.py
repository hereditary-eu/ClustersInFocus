# clustering ops namespace

from fastapi import APIRouter, HTTPException
from utils import get_logger
from models.clustering import (
    ClusteringRequest,
    ClusteringResult,
    SimilarityRequest,
    ClusterSimilarity
)
from services.clustering_service import ClusteringService
from typing import List

logger = get_logger(__name__)
clustering_router = APIRouter(prefix="/clustering", tags=["clustering"])

# Store clusters in memory (replace with proper database in production)
_clusters_store = {}

@clustering_router.post("/compute", response_model=List[ClusteringResult])
async def compute_clusters(request: ClusteringRequest):
    try:
        results = ClusteringService.compute_feature_pairs_clusters(
            data=request.data, #the entire csv?
            columns=request.columns, #the columns to cluster (exactly 2 for now)
            k=request.params.k, #the number of clusters
            max_iterations=request.params.max_iterations #the maximum number of iterations
        )

        global _clusters_store
        _clusters_store = results
        
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

@clustering_router.post("/similarities", response_model=List[ClusterSimilarity])
async def get_similarities(request: SimilarityRequest):
    try:
        if not _clusters_store:
            raise HTTPException(
                status_code=400, 
                detail="No clusters found. Please compute clusters first."
            )
        
        similarities = ClusteringService.get_cluster_similarities(
            all_clusters=_clusters_store,
            selected_feature1=request.selected_feature1,
            selected_feature2=request.selected_feature2,
            selected_cluster_id=request.selected_cluster_id
        )
        
        return [ClusterSimilarity(**sim) for sim in similarities]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
