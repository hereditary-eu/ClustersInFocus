# clustering ops namespace

from fastapi import APIRouter, HTTPException, Query, Depends
from utils import get_logger
from models.clustering import ClusteringRequest, ClusteringResult, SimilarityRequest, ClusterSimilarity
from services.clustering_service import ClusteringService
from typing import List, Dict, Optional
from database import get_db
from database.db_service import (
    get_dataset_data,
    save_clusters,
    get_all_clusters,
    get_clusters_by_features,
    create_dataset,
)
from sqlalchemy.orm import Session
from utils.data_utils import sanitize_and_parse_dataset, dataframe_to_dict_list, get_numeric_columns

logger = get_logger(__name__)
clustering_router = APIRouter(prefix="/clustering", tags=["clustering"])


@clustering_router.post("/compute", response_model=List[ClusteringResult])
async def compute_clusters(request: ClusteringRequest, db: Session = Depends(get_db)) -> List[ClusteringResult]:
    try:
        dataset_id = request.dataset_id if hasattr(request, "dataset_id") else None
        raw_data = None

        if dataset_id:
            raw_data = get_dataset_data(db, dataset_id)

        if not raw_data:
            # check if data is provided in the request
            if not request.data:
                raise HTTPException(
                    status_code=400, detail="Dataset not found in the backend and no data provided in the request"
                )

            logger.info(f"Dataset {dataset_id} not found, using data from request")
            raw_data = request.data

        try:
            df = sanitize_and_parse_dataset(raw_data)
            logger.info(f"Successfully sanitized dataset with {len(df)} rows")

            columns = request.columns
            if not columns:
                columns = get_numeric_columns(df)
                if not columns:
                    raise HTTPException(status_code=400, detail="No numeric columns found for clustering")
                logger.info(f"No columns specified, using all numeric columns: {columns}")

            # Convert back to list of dicts for processing
            sanitized_data = dataframe_to_dict_list(df)

            if not dataset_id:
                filename = (
                    request.filename
                    if hasattr(request, "filename") and request.filename
                    else "dataset_from_computation.csv"
                )
                dataset_id = create_dataset(db, sanitized_data, filename)
                logger.info(f"Created new dataset with ID {dataset_id}")

            results = ClusteringService.compute_feature_pairs_clusters(
                data=sanitized_data, columns=columns, algorithm=request.algorithm, params=request.params
            )
        except Exception as e:
            logger.error(f"Error sanitizing or processing dataset: {str(e)}")
            raise HTTPException(status_code=422, detail=f"Error processing dataset: {str(e)}")

        save_clusters(db, dataset_id, results, request.algorithm)

        formatted_results = []
        for feat1, feature_pairs in results.items():
            for feat2, clusters in feature_pairs.items():
                formatted_results.append(ClusteringResult(feature1=feat1, feature2=feat2, clusters=clusters))

        return formatted_results

    except Exception as e:
        logger.error(f"Error computing clusters: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@clustering_router.get("/get_all_clustered_feature_pairs", response_model=List[ClusteringResult])
async def get_all_clustered_feature_pairs(dataset_id: str, db: Session = Depends(get_db)) -> List[ClusteringResult]:
    clusters = get_all_clusters(db, dataset_id)
    if not clusters:
        return []

    formatted_results = []
    for feat1, feature_pairs in clusters.items():
        for feat2, clusters in feature_pairs.items():
            formatted_results.append(ClusteringResult(feature1=feat1, feature2=feat2, clusters=clusters))

    return formatted_results


@clustering_router.post("/similarities", response_model=List[ClusterSimilarity])
async def get_similarities(request: SimilarityRequest, db: Session = Depends(get_db)) -> List[ClusterSimilarity]:
    try:
        dataset_id = request.dataset_id
        if not dataset_id:
            raise HTTPException(status_code=400, detail="dataset_id is required")

        clusters = get_all_clusters(db, dataset_id)
        if not clusters:
            raise HTTPException(status_code=400, detail="No clusters found. Please compute clusters first.")
        similarities = ClusteringService.get_cluster_similarities(
            all_clusters=clusters,
            selected_feature1=request.selected_feature1,
            selected_feature2=request.selected_feature2,
            selected_cluster_id=request.selected_cluster_id,
        )

        return [ClusterSimilarity(**sim) for sim in similarities]

    except Exception as e:
        logger.error(f"Error getting similarities: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@clustering_router.get("/get_by_features")
async def get_clusters_by_features_endpoint(
    dataset_id: str,
    feature1: str = Query(..., description="First feature name"),
    feature2: str = Query(..., description="Second feature name"),
    db: Session = Depends(get_db),
) -> Optional[Dict[int, List[int]]]:
    """
    Get clusters for a specific feature pair.
    Returns a dictionary mapping cluster IDs to lists of data point indices.
    """
    try:
        clusters = get_clusters_by_features(db, dataset_id, feature1, feature2)
        if not clusters:
            raise HTTPException(status_code=404, detail="No clusters found for the given feature pair")
        return clusters

    except Exception as e:
        logger.error(f"Error retrieving clusters: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
