import { UserSettingsRecord } from "../../lib/api";

export const defaultSettings: UserSettingsRecord = {
  audio_device_id: null,
  voice_commands_enabled: true,
  macros_enabled: true,
  default_editor_target: "smart-editor",
  profile: "general",
  auto_connect_corestt: false,
  autosave_enabled: false,
  autosave_interval_seconds: 30,
  confirm_destructive_actions: true,
  duplicate_transcript_protection_enabled: true,
  duplicate_transcript_window_ms: 5000,
  ignore_blank_audio_enabled: true,
  voice_command_variants_enabled: true,
  default_template_id: null,
  show_microphone_status: true,
};
