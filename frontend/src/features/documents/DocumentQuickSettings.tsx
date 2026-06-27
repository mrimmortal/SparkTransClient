import { useState } from "react";
import { UserSettingsRecord } from "../../lib/api";
import { WorkspaceContext } from "../workspace/types";

type BooleanSettingField =
  | "voice_commands_enabled"
  | "macros_enabled"
  | "auto_connect_corestt"
  | "autosave_enabled"
  | "template_marker_navigation_enabled"
  | "template_marker_auto_advance_enabled";

type QuickSetting = {
  field: BooleanSettingField;
  label: string;
  disabled?: (settings: UserSettingsRecord) => boolean;
};

export const DOCUMENT_QUICK_SETTINGS: QuickSetting[] = [
  { field: "voice_commands_enabled", label: "Voice commands" },
  { field: "macros_enabled", label: "Macros" },
  { field: "auto_connect_corestt", label: "Auto-connect" },
  { field: "autosave_enabled", label: "Auto-save" },
  { field: "template_marker_navigation_enabled", label: "Field nav" },
  {
    field: "template_marker_auto_advance_enabled",
    label: "Auto-advance",
    disabled: (settings) => !settings.template_marker_navigation_enabled,
  },
];

export const DOCUMENT_QUICK_TARGETS = [
  { value: "smart-editor", label: "Smart" },
  { value: "micro-editor", label: "Micro" },
] as const;

export function DocumentQuickSettings({ context, showTargets = true }: { context: WorkspaceContext; showTargets?: boolean }) {
  const [savingField, setSavingField] = useState<keyof UserSettingsRecord | null>(null);
  const saving = savingField !== null;

  async function updateSetting<Field extends keyof UserSettingsRecord>(field: Field, value: UserSettingsRecord[Field]) {
    setSavingField(field);
    try {
      await context.updateSetting(field, value);
    } finally {
      setSavingField(null);
    }
  }

  return (
    <section className="document-quick-settings" aria-label="Document quick settings">
      <div className="quick-toggle-group">
        {DOCUMENT_QUICK_SETTINGS.map((setting) => {
          const checked = Boolean(context.settings[setting.field]);
          const disabled = saving || Boolean(setting.disabled?.(context.settings));
          return (
            <button
              key={setting.field}
              type="button"
              className={checked ? "quick-toggle active" : "quick-toggle"}
              aria-pressed={checked}
              disabled={disabled}
              onClick={() => void updateSetting(setting.field, !checked)}
            >
              {setting.label}
            </button>
          );
        })}
      </div>
      {showTargets && (
        <div className="quick-target-group" role="group" aria-label="Default dictation target">
          {DOCUMENT_QUICK_TARGETS.map((target) => (
            <button
              key={target.value}
              type="button"
              className={context.settings.default_editor_target === target.value ? "quick-toggle active" : "quick-toggle"}
              aria-pressed={context.settings.default_editor_target === target.value}
              disabled={saving}
              onClick={() => void updateSetting("default_editor_target", target.value)}
            >
              {target.label}
            </button>
          ))}
        </div>
      )}
      <span className="quick-settings-status">{savingField ? "Saving" : "Saved"}</span>
    </section>
  );
}
