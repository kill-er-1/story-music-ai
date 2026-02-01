import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.core.db import init_db
from app.settings import settings
from app.api.sessions import router as sessions_router
from app.api.jobs import router as jobs_router

def create_app() -> FastAPI:
    init_db()
    app = FastAPI(title="Story Music AI")

    # 静态文件：把 OUTPUT_DIR 作为 /files 暴露（MVP 用，生产建议走对象存储/CDN）
    os.makedirs(settings.output_dir, exist_ok=True)
    app.mount("/files", StaticFiles(directory=settings.output_dir), name="files")

    app.include_router(sessions_router)
    app.include_router(jobs_router)
    return app

app = create_app()
