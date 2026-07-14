import { useEffect, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { MacroRecord } from "../../lib/api";
import { canReplaceMacroDraftFromServer, canSaveMacroDraft, normalizeMacroDraft } from "../../lib/macroFlow";
import { getMacroRowStatus } from "./macrosUi";

export function MacroRow({
  macro,
  onSave,
  onDelete,
}: {
  macro: MacroRecord;
  onSave: (macro: MacroRecord, payload: Partial<Omit<MacroRecord, "id">>) => Promise<void>;
  onDelete: (macro: MacroRecord) => Promise<void>;
}) {
  const [draft, setDraft] = useState(macro);
  const [lastServerMacro, setLastServerMacro] = useState(macro);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLastServerMacro((previousServerMacro) => {
      setDraft((currentDraft) => (
        canReplaceMacroDraftFromServer(currentDraft, previousServerMacro, macro) ? macro : currentDraft
      ));
      return macro;
    });
  }, [macro]);

  const normalizedDraft = normalizeMacroDraft(draft);
  const dirty =
    normalizedDraft.trigger !== macro.trigger ||
    normalizedDraft.replacement !== macro.replacement ||
    normalizedDraft.enabled !== macro.enabled;
  const status = getMacroRowStatus(draft.enabled);

  async function saveDraft(nextDraft = draft) {
    setError("");
    const normalized = normalizeMacroDraft(nextDraft);
    if (!canSaveMacroDraft(normalized)) {
      setError("Trigger and replacement are required.");
      return;
    }
    setSaving(true);
    try {
      await onSave(macro, normalized);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Macro save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled(enabled: boolean) {
    const nextDraft = { ...draft, enabled };
    setDraft(nextDraft);
    await saveDraft(nextDraft);
  }

  async function deleteDraft() {
    setError("");
    setSaving(true);
    try {
      await onDelete(macro);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Macro delete failed");
      setSaving(false);
    }
  }

  return (
    <div className={dirty ? "table-row macro-row dirty" : "table-row macro-row"}>
      <input aria-label="Macro trigger" value={draft.trigger} onChange={(event) => setDraft({ ...draft, trigger: event.target.value })} />
      <input aria-label="Macro replacement" value={draft.replacement} onChange={(event) => setDraft({ ...draft, replacement: event.target.value })} />
      <div className="macro-row-controls">
        <label className="macro-switch">
          <input
            type="checkbox"
            aria-label={draft.enabled ? "Disable macro" : "Enable macro"}
            checked={draft.enabled}
            onChange={(event) => void toggleEnabled(event.target.checked)}
            disabled={saving}
          />
          <span aria-hidden="true" />
        </label>
        <span className={status.className}>{status.label}</span>
      </div>
      <div className="macro-row-actions">
        <button onClick={() => void saveDraft()} disabled={saving || !dirty || !canSaveMacroDraft(draft)}><Save size={16} /> {saving ? "Saving" : "Save"}</button>
        <button onClick={() => void deleteDraft()} disabled={saving}><Trash2 size={16} /> Delete</button>
      </div>
      {(dirty || error) && <span className={error ? "row-message error" : "row-message"}>{error || "Unsaved"}</span>}
    </div>
  );
}
