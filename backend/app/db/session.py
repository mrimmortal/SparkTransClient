from pathlib import Path

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings


class Base(DeclarativeBase):
    pass


settings = get_settings()
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


@event.listens_for(engine, "connect")
def configure_sqlite(dbapi_connection, _connection_record):
    if settings.database_url.startswith("sqlite"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def ensure_sqlite_parent() -> None:
    if settings.database_url.startswith("sqlite:///"):
        db_path = settings.database_url.replace("sqlite:///", "", 1)
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    ensure_sqlite_parent()
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    ensure_sqlite_settings_columns()


def ensure_sqlite_settings_columns() -> None:
    if not settings.database_url.startswith("sqlite"):
        return
    columns = {
        "auto_connect_corestt": "BOOLEAN DEFAULT 0 NOT NULL",
        "autosave_enabled": "BOOLEAN DEFAULT 0 NOT NULL",
        "autosave_interval_seconds": "INTEGER DEFAULT 30 NOT NULL",
        "confirm_destructive_actions": "BOOLEAN DEFAULT 1 NOT NULL",
        "duplicate_transcript_protection_enabled": "BOOLEAN DEFAULT 1 NOT NULL",
        "duplicate_transcript_window_ms": "INTEGER DEFAULT 5000 NOT NULL",
        "ignore_blank_audio_enabled": "BOOLEAN DEFAULT 1 NOT NULL",
        "voice_command_variants_enabled": "BOOLEAN DEFAULT 1 NOT NULL",
        "default_template_id": "INTEGER",
        "show_microphone_status": "BOOLEAN DEFAULT 1 NOT NULL",
    }
    with engine.begin() as connection:
        existing = {row[1] for row in connection.execute(text("PRAGMA table_info(user_settings)"))}
        for name, ddl in columns.items():
            if name not in existing:
                connection.execute(text(f"ALTER TABLE user_settings ADD COLUMN {name} {ddl}"))
