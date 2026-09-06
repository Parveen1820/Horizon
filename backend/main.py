from fastapi import FastAPI

app = FastAPI(title="Horizon API")


@app.get("/")
def root():
    return {
        "message": "Horizon backend is running!",
        "status": "success"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}