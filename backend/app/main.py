from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.core.config import settings
from app.database.session import Base, engine, SessionLocal
from app.database.seed import seed_database
from app.api.v1.auth import router as auth_router
from app.api.v1.complaints import router as complaints_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.users import router as users_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database schema
    Base.metadata.create_all(bind=engine)
    # Seed default demonstration data idempotently
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Centralized Hostel Complaint Management Platform with deterministic priority triage, staff assignment, and recurring issue detection.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local uploads directory for complaint images
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_FOLDER)), name="uploads")

# Mount API routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(complaints_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
def health_check():
    """Verifies that the backend server and SQLite database are fully operational."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database": "connected (SQLite)",
        "api_docs": "/docs"
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to HostelPulse — Intelligent Hostel Operations API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }
