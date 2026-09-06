from fastapi import APIRouter
from services.logic import process_data

router = APIRouter(prefix="/api/process", tags=["Processing"])


@router.post("/")
def process(data: dict):
    return process_data(data)