from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Saanidhya AI",
    description="AI-powered voice companion for elderly care",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Saanidhya AI Backend Running",
        "status": "healthy"
    }

@app.get("/health")
async def health():
    return {"status": "ok"}