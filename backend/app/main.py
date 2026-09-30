import logging
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from app.config import settings
from app.database import engine, Base
from app.routes import (
    phcs, medicines, stock, footfall, beds,
    attendance, analytics, redistribution, emergency,
    federated, gemini, csv_routes, demo
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize DB tables (Schema only - NO DATA INSERTION ON STARTUP)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="PHC-SHIELD: Federated AI for Smart Health & Supply Chain Resilience. Hackathon Track 3."
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development allow all; in production allow specified origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handlers for graceful errors
@app.exception_handler(OperationalError)
async def db_operational_error_handler(request: Request, exc: OperationalError):
    logger.error(f"Database connection error: {exc}")
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Unable to connect to database."}
    )

@app.exception_handler(SQLAlchemyError)
async def db_general_error_handler(request: Request, exc: SQLAlchemyError):
    logger.error(f"Database error: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Database operation error."}
    )

# Mount API Routers
app.include_router(phcs.router, prefix=settings.API_PREFIX)
app.include_router(medicines.router, prefix=settings.API_PREFIX)
app.include_router(stock.router, prefix=settings.API_PREFIX)
app.include_router(footfall.router, prefix=settings.API_PREFIX)
app.include_router(beds.router, prefix=settings.API_PREFIX)
app.include_router(attendance.router, prefix=settings.API_PREFIX)
app.include_router(analytics.router, prefix=settings.API_PREFIX)
app.include_router(redistribution.router, prefix=settings.API_PREFIX)
app.include_router(emergency.router, prefix=settings.API_PREFIX)
app.include_router(federated.router, prefix=settings.API_PREFIX)
app.include_router(gemini.router, prefix=settings.API_PREFIX)
app.include_router(csv_routes.router, prefix=settings.API_PREFIX)
app.include_router(demo.router, prefix=settings.API_PREFIX)

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "PHC-SHIELD Backend API",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

@app.get("/")
def root():
    return {
        "message": "Welcome to PHC-SHIELD API",
        "docs": "/docs",
        "version": settings.VERSION
    }
