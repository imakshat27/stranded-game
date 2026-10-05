"""API package."""

from app.api.game import router as game_router
from app.api.ai import router as ai_router
from app.api.analytics import router as analytics_router
from app.api.knowledge import router as knowledge_router

__all__ = [
    "game_router",
    "ai_router",
    "analytics_router",
    "knowledge_router",
]
