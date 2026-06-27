from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class UserSettingsUpdate(BaseModel):
    audio_device_id: str | None = None
    voice_commands_enabled: bool | None = None
    macros_enabled: bool | None = None
    default_editor_target: str | None = None
    profile: str | None = None
    auto_connect_corestt: bool | None = None
    autosave_enabled: bool | None = None
    autosave_interval_seconds: int | None = Field(default=None, ge=5, le=3600)
    confirm_destructive_actions: bool | None = None
    duplicate_transcript_protection_enabled: bool | None = None
    duplicate_transcript_window_ms: int | None = Field(default=None, ge=0, le=60000)
    ignore_blank_audio_enabled: bool | None = None
    voice_command_variants_enabled: bool | None = None
    default_template_id: int | None = Field(default=None, ge=1)
    show_microphone_status: bool | None = None
    template_marker_navigation_enabled: bool | None = None
    template_marker_auto_advance_enabled: bool | None = None
    ui_theme: Literal["neo-cool", "neo-warm", "neo-dark"] | None = None


class UserSettingsRead(ORMModel):
    audio_device_id: str | None
    voice_commands_enabled: bool
    macros_enabled: bool
    default_editor_target: str
    profile: str
    auto_connect_corestt: bool
    autosave_enabled: bool
    autosave_interval_seconds: int
    confirm_destructive_actions: bool
    duplicate_transcript_protection_enabled: bool
    duplicate_transcript_window_ms: int
    ignore_blank_audio_enabled: bool
    voice_command_variants_enabled: bool
    default_template_id: int | None
    show_microphone_status: bool
    template_marker_navigation_enabled: bool
    template_marker_auto_advance_enabled: bool
    ui_theme: Literal["neo-cool", "neo-warm", "neo-dark"]


class ShortcutBindingWrite(BaseModel):
    action: str
    shortcut: str
    description: str = ""


class ShortcutBindingRead(ORMModel):
    id: int
    action: str
    shortcut: str
    description: str
