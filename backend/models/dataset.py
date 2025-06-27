from typing import Dict, List, Optional, Union

from pydantic import BaseModel


class CSVDataRequest(BaseModel):
    data: List[Dict[str, Optional[Union[str, float, int, None]]]]
    filename: Optional[str] = None
