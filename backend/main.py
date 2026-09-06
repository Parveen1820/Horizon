from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.system import router as system_router
from routes.process import router as process_router
from routes.upload import router as upload_router


app = FastAPI(title="Horizon API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(system_router)
app.include_router(process_router)
app.include_router(upload_router)


@app.get("/")
def root():
    return {
        "message": "Horizon backend is running!",
        "status": "success"
    }