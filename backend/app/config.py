import os
from typing import List

class Settings:
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
        if origin.strip()
    ]
    
    # AI Provider configuration
    # Supported: 'none', 'gemini', 'openai'
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "none").lower()
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", "celebration_planner.db")

settings = Settings()
