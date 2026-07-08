import { FormEvent, ReactNode, useEffect, useState } from "react";
import { Mic, Save } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { api, UserSettingsRecord } from "../../lib/api";
import { WorkspaceContext } from "../workspace/types";
import { withWarning } from "../workspace/withWarning";
import { DomainProfileSettings } from "./DomainProfileSettings";
import { getMicrophoneStatusTone } from "./settingsUi";

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
          <>
            <span className={settingsDirty ? "save-status dirty" : "save-status"}>{saving ? "Saving..." : settingsDirty ? "Unsaved" : "Saved"}</span>
            <button className="primary" type="submit" form="settings-form" disabled={!canSave}>
              <Save size={16} /> {saving ? "Saving" : "Save settings"}
            </button>
          </>
        }
      />
      <form id="settings-form" className="settings-layout" onSubmit={(event) => void saveSettings(event)}>
        <SettingsSection title="Appearance">
          <SettingRow title="Theme preset">
            <select
              aria-label="Theme preset"
              value={draftSettings.ui_theme}
              onChange={(event) => void updateSetting("ui_theme", event.target.value as UserSettingsRecord["ui_theme"])}
            >
              <option value="neo-cool">Neo Cool</option>
              <option value="neo-warm">Neo Warm</option>
              <option value="neo-dark">Neo Dark</option>
            </select>
          </SettingRow>
        </SettingsSection>

        <SettingsSection title="Dictation">
          <SettingToggleRow
            title="Voice commands"
            description="Enable spoken commands for editing, formatting, and navigation."
            checked={draftSettings.voice_commands_enabled}
            onChange={(checked) => void updateSetting("voice_commands_enabled", checked)}
          />
          <SettingToggleRow
            title="Command variants"
            description="Allow common alternate phrases for voice commands."
            checked={draftSettings.voice_command_variants_enabled}
            onChange={(checked) => void updateSetting("voice_command_variants_enabled", checked)}
          />
          <SettingToggleRow
            title="Macro expansion"
            description="Expand configured shorthand phrases during dictation."
            checked={draftSettings.macros_enabled}
            onChange={(checked) => void updateSetting("macros_enabled", checked)}
          />
          <SettingToggleRow
            title="Auto-connect CoreSTT"
            description="Connect automatically when opening the Documents workspace."
            checked={draftSettings.auto_connect_corestt}
            onChange={(checked) => void updateSetting("auto_connect_corestt", checked)}
          />
          <SettingRow title="Default editor target" description="Choose where new dictation text is inserted by default.">
            <select
              aria-label="Default editor target"
              value={draftSettings.default_editor_target}
              onChange={(event) => void updateSetting("default_editor_target", event.target.value)}
            >
              <option value="smart-editor">Smart Editor</option>
              <option value="micro-editor">Micro Editor</option>
            </select>
          </SettingRow>
        </SettingsSection>

        <SettingsSection title="Transcription profiles" className="settings-section-wide">
          <DomainProfileSettings
            profile={draftSettings.profile}
            onProfileChange={(nextProfile) => void updateSetting("profile", nextProfile)}
            setWarning={context.setWarning}
          />
        </SettingsSection>

        <SettingsSection title="Transcript handling">
          <SettingToggleRow
            title="Ignore blank audio"
            description="Drop blank audio markers before they reach the document."
            checked={draftSettings.ignore_blank_audio_enabled}
            onChange={(checked) => void updateSetting("ignore_blank_audio_enabled", checked)}
          />
          <SettingToggleRow
            title="Prevent duplicate transcripts"
            description="Ignore repeated final transcript text within a short window."
            checked={draftSettings.duplicate_transcript_protection_enabled}
            onChange={(checked) => void updateSetting("duplicate_transcript_protection_enabled", checked)}
          />
          <SettingRow className="settings-dependent-row" title="Duplicate window">
            <select
              aria-label="Duplicate protection window"
              value={draftSettings.duplicate_transcript_window_ms}
              onChange={(event) => void updateSetting("duplicate_transcript_window_ms", Number(event.target.value))}
              disabled={!draftSettings.duplicate_transcript_protection_enabled}
            >
              <option value={2000}>2 seconds</option>
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
            </select>
          </SettingRow>
          <SettingToggleRow
            title="Auto-save documents"
            description="Save document edits automatically while working."
            checked={draftSettings.autosave_enabled}
            onChange={(checked) => void updateSetting("autosave_enabled", checked)}
          />
          <SettingRow className="settings-dependent-row" title="Auto-save interval">
            <select
              aria-label="Auto-save interval"
              value={draftSettings.autosave_interval_seconds}
              onChange={(event) => void updateSetting("autosave_interval_seconds", Number(event.target.value))}
              disabled={!draftSettings.autosave_enabled}
            >
              <option value={10}>10 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
            </select>
          </SettingRow>
        </SettingsSection>

        <SettingsSection title="Microphone">
          <SettingRow title="Device" description="Select the microphone used for browser capture.">
            <select
              aria-label="Microphone device"
              value={draftSettings.audio_device_id ?? ""}
              onChange={(event) => void updateSetting("audio_device_id", event.target.value || null)}
            >
              <option value="">Browser default microphone</option>
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>{device.label || `Microphone ${device.deviceId.slice(0, 6)}`}</option>
              ))}
            </select>
          </SettingRow>
          <SettingRow title="Device actions">
            <div className="settings-button-row">
              <button type="button" onClick={() => void loadDevices()}><Mic size={16} /> Load devices</button>
              <button type="button" onClick={() => void checkMicrophone()}>Check microphone</button>
            </div>
          </SettingRow>
          {draftSettings.show_microphone_status && (
            <SettingRow title="Status">
              <span className={`settings-status-pill ${getMicrophoneStatusTone(microphoneStatus)}`}>{microphoneStatus}</span>
            </SettingRow>
          )}
          <SettingToggleRow
            title="Show microphone status"
            description="Display the latest microphone permission and capture check result."
            checked={draftSettings.show_microphone_status}
            onChange={(checked) => void updateSetting("show_microphone_status", checked)}
          />
          <details>
            <summary>Advanced device ID</summary>
            <input
              placeholder="Audio device id"
              value={draftSettings.audio_device_id ?? ""}
              onChange={(event) => void updateSetting("audio_device_id", event.target.value || null)}
            />
          </details>
        </SettingsSection>

        <SettingsSection title="Documents and safety">
          <SettingRow title="Default template" description="Template used when creating new documents.">
            <select
              aria-label="Default template for new documents"
              value={draftSettings.default_template_id ?? ""}
              onChange={(event) => void updateSetting("default_template_id", event.target.value ? Number(event.target.value) : null)}
            >
              <option value="">Blank document</option>
              {context.templates.map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </SettingRow>
          <SettingToggleRow
            title="Confirm destructive actions"
            description="Ask before clearing content or deleting saved data."
            checked={draftSettings.confirm_destructive_actions}
            onChange={(checked) => void updateSetting("confirm_destructive_actions", checked)}
          />
          <SettingToggleRow
            title="Template marker navigation"
            description="Use dictation to move through highlighted template markers."
            checked={draftSettings.template_marker_navigation_enabled}
            onChange={(checked) => void updateSetting("template_marker_navigation_enabled", checked)}
          />
          <SettingToggleRow
            className="settings-dependent-row"
            title="Auto-advance after filling a field"
            description="Select the next template marker after dictated text replaces the current one."
            checked={draftSettings.template_marker_auto_advance_enabled}
            onChange={(checked) => void updateSetting("template_marker_auto_advance_enabled", checked)}
            disabled={!draftSettings.template_marker_navigation_enabled}
          />
        </SettingsSection>
      </form>
    </section>
  );
}

function SettingsSection({ title, className = "", children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={`settings-section ${className}`.trim()}>
      <h2 className="settings-section-title">{title}</h2>
      <div className="settings-section-body">{children}</div>
    </section>
  );
}

function SettingRow({
  title,
  description,
  className = "",
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`settings-row ${className}`.trim()}>
      <span className="settings-row-copy">
        <span>{title}</span>
        {description && <span className="settings-note">{description}</span>}
      </span>
      <span className="settings-row-control">{children}</span>
    </div>
  );
}

function SettingToggleRow({
  title,
  description,
  checked,
  disabled = false,
  className = "",
  onChange,
}: {
  title: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  className?: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={`settings-row settings-toggle-row ${className}`.trim()}>
      <span className="settings-row-copy">
        <span>{title}</span>
        {description && <span className="settings-note">{description}</span>}
      </span>
      <span className="settings-row-control">
        <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      </span>
    </label>
  );
}
