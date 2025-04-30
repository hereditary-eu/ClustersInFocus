from typing import List, Dict, Optional, Union
from pydantic import BaseModel


class CSVDataRequest(BaseModel):
    data: List[Dict[str, Optional[Union[str, float, int, None]]]]
    filename: Optional[str] = None
