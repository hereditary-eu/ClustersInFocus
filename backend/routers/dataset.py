from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, List
from utils import get_logger
from utils.data_utils import sanitize_and_parse_dataset, dataframe_to_dict_list
from database import get_db
from database.db_service import create_dataset, get_dataset_data, delete_dataset, get_all_datasets, reset_datasets
from models.dataset import CSVDataRequest


logger = get_logger(__name__)
dataset_router = APIRouter(prefix="/dataset", tags=["dataset"])


@dataset_router.get("/all")
async def get_all_datasets_endpoint(db: Session = Depends(get_db)) -> Dict[str, List[Dict[str, str]]]:
    """Get all datasets with their IDs and filenames."""
    try:
        datasets = get_all_datasets(db)
        return {"datasets": datasets}
    except Exception as e:
        logger.error(f"Error retrieving all datasets: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@dataset_router.post("/upload")
async def upload_data(request: CSVDataRequest, db: Session = Depends(get_db)) -> Dict[str, str]:
    """Upload CSV data as JSON to the database."""
    try:
        try:
            logger.info(f"Sanitizing dataset with {len(request.data)} rows")
            df = sanitize_and_parse_dataset(request.data)
            sanitized_data = dataframe_to_dict_list(df)
            logger.info("Successfully sanitized dataset")
        except Exception as e:
            logger.error(f"Error sanitizing data: {str(e)}")
            raise HTTPException(status_code=422, detail=f"Error processing dataset: {str(e)}")

        dataset_id = create_dataset(db, sanitized_data, request.filename)
        return {"message": "Data uploaded successfully", "dataset_id": dataset_id}
    except Exception as e:
        logger.error(f"Error uploading data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@dataset_router.get("/reset")
async def reset_db(db: Session = Depends(get_db)):
    """Reset the datasets table."""
    try:
        reset_datasets(db)
        return {"message": "Datasets table reset successfully"}
    except Exception as e:
        logger.error(f"Error resetting datasets: {str(e)}")


@dataset_router.get("/{dataset_id}")
async def get_dataset(dataset_id: str, db: Session = Depends(get_db)):
    """Get a dataset by its ID."""
    try:
        data = get_dataset_data(db, dataset_id)
        if not data:
            raise HTTPException(status_code=404, detail=f"Dataset with ID {dataset_id} not found")

        # Get the first row to extract headers
        if data and len(data) > 0:
            headers = list(data[0].keys())

            types = {}
            for header in headers:
                # Check first non-null value to determine type
                for row in data:
                    if header in row and row[header] is not None:
                        if isinstance(row[header], (int, float)):
                            types[header] = "numeric"
                        else:
                            types[header] = "string"
                        break
                else:
                    # If all values are null, default to string
                    types[header] = "string"

            return {"data": data, "headers": headers, "types": types}

        return {"data": [], "headers": [], "types": {}}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving dataset: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@dataset_router.delete("/{dataset_id}")
async def delete_dataset_endpoint(dataset_id: str, db: Session = Depends(get_db)) -> Dict[str, str]:
    """Delete a dataset and all its related data."""
    try:
        success = delete_dataset(db, dataset_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"Dataset with ID {dataset_id} not found")

        return {"message": "Dataset and all related data deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting dataset: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
