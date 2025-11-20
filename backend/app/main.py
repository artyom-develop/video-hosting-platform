from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response
import logging
import asyncio
from app.core.config import settings
from app.core.database import Base, engine
from app.core.metrics import PrometheusMiddleware
from app.models.models import User, Channel, Stream, StreamView, Statistic, Document
from app.routes import auth, channels, streams, statistics, documents, users, rtmp, chat, subscriptions, schedules, comments

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize database tables with retry logic
def init_db_tables():
    """Initialize database tables with retry logic"""
    max_retries = 30
    delay = 2
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Attempting to create database tables (attempt {attempt + 1}/{max_retries})...")
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables created successfully!")
            return True
        except Exception as e:
            logger.warning(f"Failed to create tables (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                import time
                time.sleep(delay)
            else:
                logger.error("Failed to initialize database after all retries")
                raise

# Try to initialize tables at startup
try:
    init_db_tables()
except Exception as e:
    logger.error(f"Critical error during database initialization: {e}")

# Initialize FastAPI app
app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description="XaTube - Видеостриминговая платформа с многопользовательским доступом"
)

# Mount static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Middleware
# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_credentials,
    allow_methods=settings.cors_methods,
    allow_headers=settings.cors_headers,
)

# Trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"],  # In production, specify exact hosts
)

# Prometheus middleware
app.add_middleware(PrometheusMiddleware)

# Include routers
app.include_router(auth.router)
app.include_router(channels.router)
app.include_router(streams.router)
app.include_router(statistics.router)
app.include_router(documents.router)
app.include_router(users.router)
app.include_router(subscriptions.router)
app.include_router(schedules.router)
app.include_router(comments.router)
app.include_router(rtmp.router)
app.include_router(chat.router)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for container orchestration"""
    return JSONResponse(
        status_code=200,
        content={"status": "healthy", "service": "StreamHub Backend"}
    )

# Metrics endpoint
@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.api_title,
        "version": settings.api_version,
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc"
    }

# Exception handlers
@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )

# Mount static files for uploads AFTER all routes
import os
uploads_path = os.path.join(os.path.dirname(__file__), "../uploads")
os.makedirs(uploads_path, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")

# Customize OpenAPI schema
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=settings.api_title,
        version=settings.api_version,
        description="Полнофункциональная видеостриминговая платформа",
        routes=app.routes,
    )
    
    openapi_schema["info"]["x-logo"] = {
        "url": "https://via.placeholder.com/150"
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("XaTube Backend starting up...")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Database: {settings.database_url}")
    logger.info(f"Redis: {settings.redis_url}")
    logger.info(f"Uploads directory mounted at /uploads")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("XaTube Backend shutting down...")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level="info"
    )
