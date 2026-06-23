from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import get_settings
from app.db.session import engine


router = APIRouter(tags=["health"])


@router.get("/health/live")
def live():
    return {"ok": True}


@router.get("/health/ready")
def ready():
    with engine.connect() as connection:
        connection.execute(text("select 1"))
    return {"ok": True}


@router.get("/health/version")
def version():
    settings = get_settings()
    return {"app": settings.app_name, "version": settings.app_version, "environment": settings.app_env}


@router.get("/config")
def public_config():
    settings = get_settings()
    return {
        "appName": settings.app_name,
        "version": settings.app_version,
        "sttProxyUrl": "/ws/stt-proxy",
        "sttProtocolVersion": "1.0",
        "audioFormat": "pcm_s16le",
    }

