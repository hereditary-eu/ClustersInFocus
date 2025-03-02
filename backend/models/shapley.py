from pydantic import BaseModel
from typing import List
import pandas as pd

class ShapValuesRequest(BaseModel):
    # model: str
    # data: pd.DataFrame
    target_column: str
    # feature_columns: List[str]


