from fastapi import APIRouter
from schemas.common import ProcessRequest, ProcessResponse
from services.logic import process_data

router = APIRouter(prefix="/api/process", tags=["Processing"])


@router.post("/", response_model=ProcessResponse)
def process(request: ProcessRequest):
    result = process_data(request.data)

    return {
        "success": result["success"],
        "message": result["message"],
        "result": result["input"],
    }