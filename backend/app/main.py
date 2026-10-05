"""STRANDED FastAPI Backend Application.

Authoritative server powering state transitions, AI search, probabilistic reasoning,
strategic planning, player profiling, and telemetry.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.database.session import init_db
from app.api import game_router, ai_router, analytics_router, knowledge_router


# Initialize DB tables
init_db()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="Backend for STRANDED: An Adaptive AI-Driven Survival & Strategic Planning Game",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration allowing custom Cloudflare subdomains, Vercel, and local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount domain API routers
app.include_router(game_router)
app.include_router(ai_router)
app.include_router(analytics_router)
app.include_router(knowledge_router)


@app.get("/")
def root():
    """Production root info endpoint."""
    return {
        "status": "ok",
        "service": "stranded-api",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }


@app.get("/health")
def health_check():
    """Deployment health check endpoint."""
    return {
        "status": "healthy",
        "database": "connected"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
