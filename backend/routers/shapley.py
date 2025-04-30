import json
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from models.shapley import ShapValuesRequest
from services.shapley_service import ShapleyService
from database import get_db
from database.db_service import get_dataset_data, save_shapley_values, get_shapley_values, create_dataset
from utils import get_logger
from utils.data_utils import sanitize_and_parse_dataset

logger = get_logger(__name__)
shapley_router = APIRouter(prefix="/shapley", tags=["shapley"])


@shapley_router.post("/compute_shap_values")
async def compute_shap_values(request: ShapValuesRequest, db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    try:
        raw_data = get_dataset_data(db, request.dataset_id)

        if not raw_data:
            if not request.data:
                raise HTTPException(
                    status_code=400,
                    detail=f"Dataset with ID {request.dataset_id} not found and no data provided in the request",
                )

            logger.info(f"Dataset {request.dataset_id} not found, using data from request")
            raw_data = request.data

        # Sanitize the data
        try:
            logger.info(f"Sanitizing dataset with {len(raw_data)} rows")
            data_df = sanitize_and_parse_dataset(raw_data)

            # Save sanitized data if it's from the request
            if not request.dataset_id or request.data:
                filename = (
                    request.filename
                    if hasattr(request, "filename") and request.filename
                    else "dataset_from_shapley.csv"
                )
                request.dataset_id = create_dataset(db, json.loads(data_df.to_json(orient="records")), filename)
                logger.info(f"Created new dataset with ID {request.dataset_id}")
        except Exception as e:
            logger.error(f"Error sanitizing data: {str(e)}")
            raise HTTPException(status_code=422, detail=f"Error processing dataset: {str(e)}")

        if request.target_column not in data_df.columns:
            raise HTTPException(status_code=400, detail=f"Target column {request.target_column} not found in data")

        shapley_service = ShapleyService()
        shap_values = shapley_service.compute_shapley_values_from_df(data_df, request.target_column)

        shap_values_records = json.loads(shap_values.to_json(orient="records"))

        save_shapley_values(db, request.dataset_id, request.target_column, shap_values_records)

        return shap_values_records
    except Exception as e:
        logger.error(f"Error computing Shapley values: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@shapley_router.get("/get_shapley_values/{dataset_id}/{target_column}")
async def get_shapley_values_endpoint(
    dataset_id: str, target_column: str, db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    try:
        values = get_shapley_values(db, dataset_id, target_column)
        if not values:
            raise HTTPException(status_code=404, detail=f"Shapley values for target column {target_column} not found")

        return values
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting Shapley values: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
