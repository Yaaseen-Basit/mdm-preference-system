from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.core.config import settings
from app.core.database import init_db
from app.api.v1 import auth, admin, student

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="MDM Smart Allocation System",
    description="Enterprise-grade MDM Subject Preference Allocation Platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(student.router)


@app.on_event("startup")
async def startup_event():
    logger.info("Initializing database...")
    init_db()
    # from app.utils.seed import seed_all
    # seed_all()
    logger.info("MDM Smart Allocation System started successfully")


@app.get("/")
def root():
    return {"message": "MDM Smart Allocation System API", "version": "1.0.0", "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy"}
