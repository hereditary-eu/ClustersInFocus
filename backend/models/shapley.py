from pydantic import BaseModel
from typing import List, Dict, Optional, Union


class ShapValuesRequest(BaseModel):
    target_column: str
    dataset_id: Optional[str] = None  # Optional to allow data-only requests
    data: Optional[List[Dict[str, Optional[Union[str, float, int, None]]]]] = (
        None  # Data to use if dataset_id doesn't exist
    )
    filename: Optional[str] = None  # Filename to use when saving data
    # feature_columns: List[str]
