from fastapi import APIRouter, UploadFile, File, HTTPException

from services.csv_logic import analyze_csv


router = APIRouter(
    prefix="/api/upload",
    tags=["File Upload"]
)


@router.post("/csv")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected"
        )

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported"
        )

    content = await file.read()

    try:
        result = analyze_csv(content)

        result["filename"] = file.filename

        return result

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to process CSV: {str(error)}"
        )