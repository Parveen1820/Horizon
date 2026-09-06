from pydantic import BaseModel
from typing import Any


class ProcessRequest(BaseModel):
    data: dict[str, Any]


class ProcessResponse(BaseModel):
    success: bool
    message: str
    result: Any