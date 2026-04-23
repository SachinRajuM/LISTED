import logging
from contextlib import asynccontextmanager
from pathlib import Path
 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
 
from config import settings
from database import create_tables
from limiter import limiter          # ← import from limiter.py, not here
from routers import auth, jobs, resumes, rankings, admin
 
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
 
 
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 RecruitAI backend starting up...")
    create_tables()
    logger.info("✅ Database tables created/verified")
    Path(settings.UPLOAD_DIR).mkdir(exist_ok=True)
    logger.info(f"✅ Upload dir ready: {settings.UPLOAD_DIR}")
    yield
    logger.info("🛑 RecruitAI backend shutting down")
 
 
app = FastAPI(
    title="RecruitAI API",
    description="AI-Powered Resume Screening & Ranking System",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)
 
# Attach limiter to app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
 
# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:80",
        "http://localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
# Routers
app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(resumes.router)
app.include_router(rankings.router)
app.include_router(admin.router)
 
 
@app.get("/health", tags=["health"])
def health():
    return {"status": "healthy", "version": "1.0.0", "service": "RecruitAI"}
 
 
@app.get("/", tags=["root"])
def root():
    return {"message": "RecruitAI API", "docs": "/docs", "health": "/health"}
 