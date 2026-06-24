import { FormEvent, useEffect, useState } from "react";
import { Mic, Plus, Save, Trash2 } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { api } from "../../lib/api";
import { WorkspaceContext } from "../workspace/types";
import { withWarning } from "../workspace/withWarning";
import { stripShortcutId, updateShortcut } from "./shortcutDrafts";

export function SettingsPage({ context }: { context: WorkspaceContext }) {
  const [draftSettings, setDraftSettings] = useState(context.settings);
  const [draftShortcuts, setDraftShortcuts] = useState(context.shortcuts.map(stripShortcutId));
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [saving, setSaving] = useState(false);
  const [microphoneStatus, setMicrophoneStatus] = useState("Not checked");

  useEffect(() => setDraftSettings(context.settings), [context.settings]);
  useEffect(() => setDraftShortcuts(context.shortcuts.map(stripShortcutId)), [context.shortcuts]);

  const settingsDirty = JSON.stringify(draftSettings) !== JSON.stringify(context.settings);
  const shortcutsDirty = JSON.stringify(draftShortcuts) !== JSON.stringify(context.shortcuts.map(stripShortcutId));
  const canSave = (settingsDirty || shortcutsDirty) && !saving;

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    setSaving(true);
    await withWarning(context, async () => {
      const [nextSettings, nextShortcuts] = await Promise.all([
        api.updateSettings(draftSettings),
        api.replaceShortcuts(draftShortcuts.filter((shortcut) => shortcut.action && shortcut.shortcut)),
      ]);
      context.setSettings(nextSettings);
      context.setShortcuts(nextShortcuts);
    });
    setSaving(false);
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
      <PageHeader title="Settings" />
      <form className="settings-grid" onSubmit={(event) => void saveSettings(event)}>
        <section className="panel stack">
          <div className="panel-heading">
            <h2>Dictation</h2>
            <span className={settingsDirty ? "save-status dirty" : "save-status"}>{saving ? "Saving..." : settingsDirty ? "Unsaved" : "Saved"}</span>
          </div>
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.voice_commands_enabled}
              onChange={(event) => setDraftSettings({ ...draftSettings, voice_commands_enabled: event.target.checked })}
            />
            Voice commands enabled
          </label>
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.voice_command_variants_enabled}
              onChange={(event) => setDraftSettings({ ...draftSettings, voice_command_variants_enabled: event.target.checked })}
            />
            Allow common voice command variants
          </label>
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.macros_enabled}
              onChange={(event) => setDraftSettings({ ...draftSettings, macros_enabled: event.target.checked })}
            />
            Macro expansion enabled
          </label>
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.auto_connect_corestt}
              onChange={(event) => setDraftSettings({ ...draftSettings, auto_connect_corestt: event.target.checked })}
            />
            Auto-connect CoreSTT on Documents
          </label>
          <label>
            Default editor target
            <select
              value={draftSettings.default_editor_target}
              onChange={(event) => setDraftSettings({ ...draftSettings, default_editor_target: event.target.value })}
            >
              <option value="smart-editor">Smart Editor</option>
              <option value="micro-editor">Micro Editor</option>
            </select>
          </label>
          <label>
            Dictation profile
            <select value={draftSettings.profile} onChange={(event) => setDraftSettings({ ...draftSettings, profile: event.target.value })}>
              <option value="general">General</option>
              <option value="meeting-notes">Meeting notes</option>
              <option value="medical">Medical</option>
            </select>
          </label>
        </section>

        <section className="panel stack">
          <h2>Transcript handling</h2>
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.ignore_blank_audio_enabled}
              onChange={(event) => setDraftSettings({ ...draftSettings, ignore_blank_audio_enabled: event.target.checked })}
            />
            Ignore blank audio markers
          </label>
          <label className="compact-check">
            <input
              type="checkbox"
              checked={draftSettings.duplicate_transcript_protection_enabled}
              onChange={(event) => setDraftSettings({ ...draftSettings, duplicate_transcript_protection_enabled: event.target.checked })}
            />
            Prevent repeated final transcripts
          </label>
          <label>
            Duplicate protection window
            <select
              value={draftSettings.duplicate_transcript_window_ms}
              onChange={(event) => setDraftSettings({ ...draftSettings, duplicate_transcript_window_ms: Number(event.target.value) })}
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
              onChange={(event) => setDraftSettings({ ...draftSettings, autosave_enabled: event.target.checked })}
            />
            Auto-save documents
          </label>
          <label>
            Auto-save interval
            <select
              value={draftSettings.autosave_interval_seconds}
              onChange={(event) => setDraftSettings({ ...draftSettings, autosave_interval_seconds: Number(event.target.value) })}
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
            onChange={(event) => setDraftSettings({ ...draftSettings, audio_device_id: event.target.value || null })}
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
              onChange={(event) => setDraftSettings({ ...draftSettings, show_microphone_status: event.target.checked })}
            />
            Show microphone status
          </label>
          <details>
            <summary>Advanced device ID</summary>
            <input
              placeholder="Audio device id"
              value={draftSettings.audio_device_id ?? ""}
              onChange={(event) => setDraftSettings({ ...draftSettings, audio_device_id: event.target.value || null })}
            />
          </details>
        </section>

        <section className="panel stack">
          <h2>Documents and safety</h2>
          <label>
            Default template for new documents
            <select
              value={draftSettings.default_template_id ?? ""}
              onChange={(event) => setDraftSettings({ ...draftSettings, default_template_id: event.target.value ? Number(event.target.value) : null })}
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
              onChange={(event) => setDraftSettings({ ...draftSettings, confirm_destructive_actions: event.target.checked })}
            />
            Confirm before clearing or deleting data
          </label>
        </section>

        <section className="panel wide stack">
          <div className="panel-heading">
            <h2>Shortcuts</h2>
            <span className={shortcutsDirty ? "save-status dirty" : "save-status"}>{shortcutsDirty ? "Unsaved" : "Saved"}</span>
          </div>
          {draftShortcuts.map((shortcut, index) => (
            <div className="shortcut-row" key={`${shortcut.action}-${index}`}>
              <input
                placeholder="Action"
                value={shortcut.action}
                onChange={(event) => setDraftShortcuts(updateShortcut(draftShortcuts, index, { action: event.target.value }))}
              />
              <input
                placeholder="Shortcut"
                value={shortcut.shortcut}
                onChange={(event) => setDraftShortcuts(updateShortcut(draftShortcuts, index, { shortcut: event.target.value }))}
              />
              <input
                placeholder="Description"
                value={shortcut.description}
                onChange={(event) => setDraftShortcuts(updateShortcut(draftShortcuts, index, { description: event.target.value }))}
              />
              <button type="button" onClick={() => setDraftShortcuts(draftShortcuts.filter((_, itemIndex) => itemIndex !== index))}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <div className="button-row">
            <button type="button" onClick={() => setDraftShortcuts([...draftShortcuts, { action: "", shortcut: "", description: "" }])}>
              <Plus size={16} /> Add shortcut
            </button>
            <button className="primary" type="submit" disabled={!canSave}><Save size={16} /> {saving ? "Saving" : "Save settings"}</button>
          </div>
        </section>
      </form>
    </section>
  );
}
