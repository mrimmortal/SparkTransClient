import { FormEvent, useEffect, useState } from "react";
import { Mic, Save } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { api, UserSettingsRecord } from "../../lib/api";
import { WorkspaceContext } from "../workspace/types";
import { withWarning } from "../workspace/withWarning";

export function SettingsPage({ context }: { context: WorkspaceContext }) {
  const [draftSettings, setDraftSettings] = useState(context.settings);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [saving, setSaving] = useState(false);
  const [microphoneStatus, setMicrophoneStatus] = useState("Not checked");

  useEffect(() => setDraftSettings(context.settings), [context.settings]);

  const settingsDirty = JSON.stringify(draftSettings) !== JSON.stringify(context.settings);
  const canSave = settingsDirty && !saving;

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    setSaving(true);
    await withWarning(context, async () => {
      const nextSettings = await api.updateSettings(draftSettings);
      context.setSettings(nextSettings);
    });
    setSaving(false);
  }

  async function updateSetting<Field extends keyof UserSettingsRecord>(field: Field, value: UserSettingsRecord[Field]) {
    setDraftSettings((current) => ({ ...current, [field]: value }));
  }

  async function loadDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) {
      context.setWarning("This browser cannot list audio devices.");
      return;
    }
    const nextDevices = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === "audioinput");
    setDevices(nextDevices);
  }

  async function checkMicrophone() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicrophoneStatus("Microphone capture is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: draftSettings.audio_device_id || undefined } });
      stream.getTracks().forEach((track) => track.stop());
      setMicrophoneStatus("Microphone permission and capture are available.");
    } catch (error) {
      setMicrophoneStatus(error instanceof Error ? error.message : "Microphone check failed.");
    }
  }

  return (
    <section className="manager-page">
      <PageHeader
        title="Settings"
        actions={
          <button className="primary" type="submit" form="settings-form" disabled={!canSave}>
            <Save size={16} /> {saving ? "Saving" : "Save settings"}
          </button>
        }
      />
      <form id="settings-form" className="settings-grid" onSubmit={(event) => void saveSettings(event)}>
        <section className="panel stack">
          <div className="panel-heading">
            <h2>Dictation</h2>
            <span className={settingsDirty ? "save-status dirty" : "save-status"}>{saving ? "Saving..." : settingsDirty ? "Unsaved" : "Saved"}</span>
          </div>
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.voice_commands_enabled}
              onChange={(event) => void updateSetting("voice_commands_enabled", event.target.checked)}
            />
            Voice commands enabled
          </label>
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.voice_command_variants_enabled}
              onChange={(event) => void updateSetting("voice_command_variants_enabled", event.target.checked)}
            />
            Allow common voice command variants
          </label>
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.macros_enabled}
              onChange={(event) => void updateSetting("macros_enabled", event.target.checked)}
            />
            Macro expansion enabled
          </label>
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.auto_connect_corestt}
              onChange={(event) => void updateSetting("auto_connect_corestt", event.target.checked)}
            />
            Auto-connect CoreSTT on Documents
          </label>
          <label>
            Default editor target
            <select
              value={draftSettings.default_editor_target}
              onChange={(event) => void updateSetting("default_editor_target", event.target.value)}
            >
              <option value="smart-editor">Smart Editor</option>
              <option value="micro-editor">Micro Editor</option>
            </select>
          </label>
        </section>

        <section className="panel stack">
          <h2>Transcript handling</h2>
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.ignore_blank_audio_enabled}
              onChange={(event) => void updateSetting("ignore_blank_audio_enabled", event.target.checked)}
            />
            Ignore blank audio markers
          </label>
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.duplicate_transcript_protection_enabled}
              onChange={(event) => void updateSetting("duplicate_transcript_protection_enabled", event.target.checked)}
            />
            Prevent repeated final transcripts
          </label>
          <label>
            Duplicate protection window
            <select
              value={draftSettings.duplicate_transcript_window_ms}
              onChange={(event) => void updateSetting("duplicate_transcript_window_ms", Number(event.target.value))}
              disabled={!draftSettings.duplicate_transcript_protection_enabled}
            >
              <option value={2000}>2 seconds</option>
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
            </select>
          </label>
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.autosave_enabled}
              onChange={(event) => void updateSetting("autosave_enabled", event.target.checked)}
            />
            Auto-save documents
          </label>
          <label>
            Auto-save interval
            <select
              value={draftSettings.autosave_interval_seconds}
              onChange={(event) => void updateSetting("autosave_interval_seconds", Number(event.target.value))}
              disabled={!draftSettings.autosave_enabled}
            >
              <option value={10}>10 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
            </select>
          </label>
        </section>

        <section className="panel stack">
          <h2>Microphone</h2>
          <div className="button-row">
            <button type="button" onClick={() => void loadDevices()}><Mic size={16} /> Load devices</button>
            <button type="button" onClick={() => void checkMicrophone()}>Check microphone</button>
          </div>
          <select
            value={draftSettings.audio_device_id ?? ""}
            onChange={(event) => void updateSetting("audio_device_id", event.target.value || null)}
          >
            <option value="">Browser default microphone</option>
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>{device.label || `Microphone ${device.deviceId.slice(0, 6)}`}</option>
            ))}
          </select>
          {draftSettings.show_microphone_status && <p className="settings-note">{microphoneStatus}</p>}
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.show_microphone_status}
              onChange={(event) => void updateSetting("show_microphone_status", event.target.checked)}
            />
            Show microphone status
          </label>
          <details>
            <summary>Advanced device ID</summary>
            <input
              placeholder="Audio device id"
              value={draftSettings.audio_device_id ?? ""}
              onChange={(event) => void updateSetting("audio_device_id", event.target.value || null)}
            />
          </details>
        </section>

        <section className="panel stack">
          <h2>Documents and safety</h2>
          <label>
            Default template for new documents
            <select
              value={draftSettings.default_template_id ?? ""}
              onChange={(event) => void updateSetting("default_template_id", event.target.value ? Number(event.target.value) : null)}
            >
              <option value="">Blank document</option>
              {context.templates.map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </label>
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.confirm_destructive_actions}
              onChange={(event) => void updateSetting("confirm_destructive_actions", event.target.checked)}
            />
            Confirm before clearing or deleting data
          </label>
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.template_marker_navigation_enabled}
              onChange={(event) => void updateSetting("template_marker_navigation_enabled", event.target.checked)}
            />
            <span className="setting-label-copy">
              <span>Navigate template fields by voice</span>
              <span className="settings-note">Use dictation to move through highlighted template markers.</span>
            </span>
          </label>
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.template_marker_auto_advance_enabled}
              onChange={(event) => void updateSetting("template_marker_auto_advance_enabled", event.target.checked)}
              disabled={!draftSettings.template_marker_navigation_enabled}
            />
            <span className="setting-label-copy">
              <span>Auto-advance after filling a field</span>
              <span className="settings-note">Select the next template marker after dictated text replaces the current one.</span>
            </span>
          </label>
        </section>
      </form>
    </section>
  );
}
