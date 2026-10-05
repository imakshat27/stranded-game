"""Core application settings and configuration loader.

Reads settings from environment variables or .env files,
and loads domain configurations (actions, events, resources, difficulty, escape).
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
import json
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
CONFIG_DIR = BASE_DIR / "config"


class Settings(BaseSettings):
    """Application settings schema."""
    APP_NAME: str = "STRANDED API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,https://stranded-game.vercel.app"
    DATABASE_URL: str = "sqlite:///./stranded.db"

    SEARCH_MAX_NODES: int = 5000
    SEARCH_MAX_DEPTH: int = 30
    SEARCH_TIMEOUT_MS: int = 2500

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()


class ConfigLoader:
    """Loads and caches static configuration JSONs."""
    _cache: Dict[str, Any] = {}

    @classmethod
    def load_json(cls, filename: str) -> Any:
        if filename not in cls._cache:
            filepath = CONFIG_DIR / filename
            if not filepath.exists():
                raise FileNotFoundError(f"Configuration file not found: {filepath}")
            with open(filepath, "r", encoding="utf-8") as f:
                cls._cache[filename] = json.load(f)
        return cls._cache[filename]

    @classmethod
    def get_actions(cls) -> List[Dict[str, Any]]:
        return cls.load_json("actions.json")

    @classmethod
    def get_events(cls) -> List[Dict[str, Any]]:
        return cls.load_json("events.json")

    @classmethod
    def get_resources(cls) -> Dict[str, Any]:
        return cls.load_json("resources.json")

    @classmethod
    def get_difficulty(cls) -> Dict[str, Any]:
        return cls.load_json("difficulty.json")

    @classmethod
    def get_escape(cls) -> Dict[str, Any]:
        return cls.load_json("escape.json")
