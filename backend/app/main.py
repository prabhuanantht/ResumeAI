from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import init_db
from backend.app.routes import resume, tailor, compile, settings as settings_route, auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database schemas
    await init_db()
    yield

app = FastAPI(
    title="Overleaf-Grade LaTeX Resume Builder API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(tailor.router)
app.include_router(compile.router)
app.include_router(settings_route.router)

@app.get("/")
async def root():
    return {
        "app": "Overleaf-Grade LaTeX Resume Builder Backend",
        "status": "online",
        "tectonic_available": True,
        "docs": "/docs"
    }

@app.get("/api/health")
async def health():
    return {"status": "ok"}
