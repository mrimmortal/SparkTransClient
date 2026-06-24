import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { MacroRecord, api } from "../../lib/api";
import { canSaveMacroDraft, normalizeMacroDraft, removeMacroById, upsertMacro } from "../../lib/macroFlow";
import { confirmationMessages } from "../../lib/editorFlow";
import { WorkspaceContext } from "../workspace/types";
import { withWarning } from "../workspace/withWarning";
import { MacroRow } from "./MacroRow";

export function MacrosPage({ context }: { context: WorkspaceContext }) {
  const [trigger, setTrigger] = useState("");
  const [replacement, setReplacement] = useState("");
  const [creating, setCreating] = useState(false);
  const createDraft = { trigger, replacement, enabled: true };

  async function createMacro(event: FormEvent) {
    event.preventDefault();
    if (!canSaveMacroDraft(createDraft)) return;
    setCreating(true);
    await withWarning(context, async () => {
      const macro = await api.createMacro(normalizeMacroDraft(createDraft));
      context.setMacros((current) => upsertMacro(current, macro));
      setTrigger("");
      setReplacement("");
    });
    setCreating(false);
  }

  async function updateMacro(macro: MacroRecord, payload: Partial<Omit<MacroRecord, "id">>) {
    const nextPayload = {
      ...payload,
      ...(payload.trigger !== undefined ? { trigger: payload.trigger.trim() } : {}),
      ...(payload.replacement !== undefined ? { replacement: payload.replacement.trim() } : {}),
    };
    if ((nextPayload.trigger !== undefined && !nextPayload.trigger) || (nextPayload.replacement !== undefined && !nextPayload.replacement)) {
      throw new Error("Macro trigger and replacement are required.");
    }
    const updated = await api.updateMacro(macro.id, nextPayload);
    context.setMacros((current) => upsertMacro(current, updated));
  }

  async function deleteMacro(macro: MacroRecord) {
    if (context.settings.confirm_destructive_actions && !window.confirm(confirmationMessages.deleteMacro)) return;
    await api.deleteMacro(macro.id);
    context.setMacros((current) => removeMacroById(current, macro.id));
  }

  return (
    <section className="manager-page">
      <PageHeader title="Macros" />
      <div className="manager-grid two">
        <section className="panel">
          <form onSubmit={(event) => void createMacro(event)} className="stack">
            <h2>New macro</h2>
            <input placeholder="Trigger phrase" value={trigger} onChange={(event) => setTrigger(event.target.value)} />
            <textarea placeholder="Replacement text" value={replacement} onChange={(event) => setReplacement(event.target.value)} />
            <button className="primary" type="submit" disabled={creating || !canSaveMacroDraft(createDraft)}><Plus size={16} /> {creating ? "Creating" : "Create macro"}</button>
          </form>
        </section>
        <section className="panel wide">
          <div className="table-list">
            {context.macros.map((macro) => (
              <MacroRow key={macro.id} macro={macro} onSave={updateMacro} onDelete={deleteMacro} />
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
