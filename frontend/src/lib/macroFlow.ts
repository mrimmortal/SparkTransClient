import { MacroRecord } from "./api";

export type MacroDraft = Omit<MacroRecord, "id">;

export function normalizeMacroDraft(draft: MacroDraft): MacroDraft {
  return {
    trigger: draft.trigger.trim(),
    replacement: draft.replacement.trim(),
    enabled: draft.enabled,
  };
}

export function canSaveMacroDraft(draft: MacroDraft): boolean {
  const normalized = normalizeMacroDraft(draft);
  return Boolean(normalized.trigger && normalized.replacement);
}

export function upsertMacro(macros: MacroRecord[], macro: MacroRecord): MacroRecord[] {
  if (!macros.some((item) => item.id === macro.id)) {
    return [...macros, macro];
  }
  return macros.map((item) => (item.id === macro.id ? macro : item));
}

export function removeMacroById(macros: MacroRecord[], id: number): MacroRecord[] {
  return macros.filter((item) => item.id !== id);
}
