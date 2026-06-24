import { useEffect, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { MacroRecord } from "../../lib/api";
import { canSaveMacroDraft, normalizeMacroDraft } from "../../lib/macroFlow";

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setDraft(macro), [macro]);

  const normalizedDraft = normalizeMacroDraft(draft);
  const dirty =
    normalizedDraft.trigger !== macro.trigger ||
    normalizedDraft.replacement !== macro.replacement ||
    normalizedDraft.enabled !== macro.enabled;

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
    <div className={dirty ? "table-row dirty" : "table-row"}>
      <input aria-label="Macro trigger" value={draft.trigger} onChange={(event) => setDraft({ ...draft, trigger: event.target.value })} />
      <input aria-label="Macro replacement" value={draft.replacement} onChange={(event) => setDraft({ ...draft, replacement: event.target.value })} />
      <label className="compact-check">
        <input type="checkbox" checked={draft.enabled} onChange={(event) => void toggleEnabled(event.target.checked)} disabled={saving} />
        Enabled
      </label>
      <button onClick={() => void saveDraft()} disabled={saving || !dirty || !canSaveMacroDraft(draft)}><Save size={16} /> {saving ? "Saving" : "Save"}</button>
      <button onClick={() => void deleteDraft()} disabled={saving}><Trash2 size={16} /> Delete</button>
      {(dirty || error) && <span className={error ? "row-message error" : "row-message"}>{error || "Unsaved"}</span>}
    </div>
  );
}
