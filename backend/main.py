"""
SAATHI Backend — FastAPI Application
Main entry point with CORS, REST routes, and WebSocket setup.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import FRONTEND_URL
from database import ping_db

app = FastAPI(
    title="SAATHI API",
    description="AI-powered social confidence and communication practice platform",
    version="1.0.0",
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "SAATHI API is running", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    db_ok = await ping_db()
    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "unavailable",
    }


# Import and register routers
from routers import chat, roleplay

app.include_router(chat.router, prefix="/api", tags=["AI Companion"])
app.include_router(roleplay.router, prefix="/api", tags=["Roleplay"])
