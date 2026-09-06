from fastapi import APIRouter

router = APIRouter(prefix="/api/system", tags=["System"])


@router.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "Horizon API"
    }