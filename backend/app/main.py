from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .config import settings
from .database import init_db
from .routers import events, planner, budget, timeline, guests, export

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database
    init_db()
    yield

app = FastAPI(
    title="Celebration Event Planner AI Backend",
    description="Deterministic planning engine and contextual event orchestration API.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security and payload size check middleware
@app.middleware("http")
async def security_middleware(request: Request, call_next):
    # Enforce request payload size limit (max 5 MB)
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 5 * 1024 * 1024:
        return JSONResponse(status_code=413, content={"detail": "Request payload exceeds 5MB limit."})

    response: Response = await call_next(request)
    # Add security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Include feature routers
app.include_router(events.router)
app.include_router(planner.router)
app.include_router(budget.router)
app.include_router(timeline.router)
app.include_router(guests.router)
app.include_router(export.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Celebration Event Planner AI",
        "version": "1.0.0",
        "ai_provider": settings.AI_PROVIDER,
        "environment": settings.ENVIRONMENT
    }

import os
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Check for frontend build directory
FRONTEND_DIST_DIR = os.getenv(
    "FRONTEND_DIST_DIR",
    str(Path(__file__).resolve().parent.parent.parent / "frontend" / "dist")
)

if os.path.isdir(FRONTEND_DIST_DIR):
    assets_dir = os.path.join(FRONTEND_DIST_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        if full_path.startswith(("api/", "docs", "openapi.json", "redoc")):
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        
        target_file = os.path.join(FRONTEND_DIST_DIR, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)
            
        index_file = os.path.join(FRONTEND_DIST_DIR, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
            
        return JSONResponse(status_code=404, content={"detail": "Frontend index.html not found"})
else:
    @app.get("/", include_in_schema=False)
    async def index_placeholder():
        return {
            "message": "Celebration Event Planner AI Backend is Running",
            "docs": "/docs",
            "health": "/api/health",
            "note": "Frontend build directory not found. Please build the frontend."
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
