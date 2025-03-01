# shap values namespace

from fastapi import APIRouter
from utils import get_logger

logger = get_logger(__name__)
analysis_router = APIRouter(prefix="/analysis", tags=["analysis"])

@analysis_router.get("/ping")
async def ping():
    return {"message": "pong"}

