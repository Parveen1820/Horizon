from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from services.ai_logic import train_classification_model


router = APIRouter(
    prefix="/api/process",
    tags=["Processing"]
)


@router.post("/")
def process(data: dict):
    return {
        "success": True,
        "message": "Data processed successfully",
        "result": data,
    }


@router.post("/train")
async def train_model(
    file: UploadFile = File(...),
    target_column: str = Form(...)
):
    """
    Upload a CSV dataset and train a
    Random Forest classification model.
    """

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected."
        )

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported."
        )

    if not target_column.strip():
        raise HTTPException(
            status_code=400,
            detail="Target column is required."
        )

    try:

        content = await file.read()

        if not content:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty."
            )

        result = train_classification_model(
            file_content=content,
            target_column=target_column.strip()
        )

        result["filename"] = file.filename

        return result

    except HTTPException:
        raise

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Model training failed: {str(error)}"
        )