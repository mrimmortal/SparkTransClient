from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class UserSettings(Base):
    __tablename__ = "user_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    audio_device_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    voice_commands_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    macros_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    default_editor_target: Mapped[str] = mapped_column(String(64), default="smart-editor")
    profile: Mapped[str] = mapped_column(String(64), default="general")
    auto_connect_corestt: Mapped[bool] = mapped_column(Boolean, default=False)
    autosave_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    autosave_interval_seconds: Mapped[int] = mapped_column(Integer, default=30)
    confirm_destructive_actions: Mapped[bool] = mapped_column(Boolean, default=True)
    duplicate_transcript_protection_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    duplicate_transcript_window_ms: Mapped[int] = mapped_column(Integer, default=5000)
    ignore_blank_audio_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    voice_command_variants_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    default_template_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    show_microphone_status: Mapped[bool] = mapped_column(Boolean, default=True)
    template_marker_navigation_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    template_marker_auto_advance_enabled: Mapped[bool] = mapped_column(Boolean, default=False)


class ShortcutBinding(Base):
    __tablename__ = "shortcut_bindings"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    action: Mapped[str] = mapped_column(String(128), index=True)
    shortcut: Mapped[str] = mapped_column(String(128))
    description: Mapped[str] = mapped_column(Text, default="")
