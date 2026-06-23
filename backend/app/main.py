from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.api import auth, documents, health, macros, settings, stt_proxy, templates
from app.core.config import get_settings
from app.core.logging import configure_logging, request_log_middleware
from app.db.session import init_db


def create_app() -> FastAPI:
    configure_logging()
    app_settings = get_settings()
    app = FastAPI(title=app_settings.app_name, version=app_settings.app_version)
    app.middleware("http")(request_log_middleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=app_settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["*"],
    )
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=app_settings.trusted_hosts)

    @app.on_event("startup")
    def startup() -> None:
        init_db()

    app.include_router(health.router, prefix="/api")
    app.include_router(auth.router, prefix="/api")
    app.include_router(documents.router, prefix="/api")
    app.include_router(templates.router, prefix="/api")
    app.include_router(macros.router, prefix="/api")
    app.include_router(settings.router, prefix="/api")
    app.include_router(stt_proxy.router)
    return app


app = create_app()

