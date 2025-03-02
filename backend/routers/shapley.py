# shap values namespace
import pandas as pd
from fastapi import APIRouter, HTTPException
from utils import get_logger
from models.shapley import ShapValuesRequest
from services.shapley_service import ShapleyService
from database import temp_database
import json

logger = get_logger(__name__)
shapley_router = APIRouter(prefix="/shapley", tags=["shapley"])


@shapley_router.post("/compute_shap_values")
async def compute_shap_values(request: ShapValuesRequest):
    shapley_service = ShapleyService()

    data = pd.DataFrame(temp_database['data'])
    if request.target_column not in data.columns:
        raise HTTPException(status_code=400, detail=f"Target column {request.target_column} not found in data")

    shap_values = shapley_service.get_shap_values(request.target_column)
    shap_values_json = shap_values.to_json(orient='records')
    return json.loads(shap_values_json)



@shapley_router.get("/get_shapley_values/{target_column}")
async def get_shapley_values(target_column: str):
    shap_values = temp_database['shap_values'].get(target_column, None)
    if shap_values is None:
        raise HTTPException(status_code=404, detail=f"Shapley values for target column {target_column} not found")
    shap_values_json = shap_values.to_json(orient='records')
    return json.loads(shap_values_json)