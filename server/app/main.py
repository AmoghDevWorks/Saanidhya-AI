import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_indexes, close_mongo_connection
from app.routes.auth import router as auth_router
from app.routes.checkin import router as checkin_router
from app.routes.family import router as family_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("saanidhya.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: attempt to initialize database indexes
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    init_indexes()
    yield
    # Shutdown: close MongoDB connection pool
    close_mongo_connection()
    logger.info(f"Shutting down {settings.APP_NAME}")


app = FastAPI(
    title="Saanidhya AI",
    description="AI-powered voice companion and wellness monitoring for elderly care",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# CORS configuration
allowed_origins = [
    settings.FRONTEND_URL.rstrip("/"),
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
]
# Remove duplicates
allowed_origins = list(set(allowed_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(auth_router, prefix="/api/auth")
app.include_router(checkin_router, prefix="/api/checkin")
app.include_router(family_router, prefix="/api/family")


@app.get("/", tags=["Health"])
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "auth": "/api/auth",
        },
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "app": settings.APP_NAME}
