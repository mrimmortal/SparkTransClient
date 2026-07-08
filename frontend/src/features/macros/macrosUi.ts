export type MacrosLayoutCopy = {
  builderTitle: string;
  libraryTitle: string;
};

export type MacroRowStatus = {
  label: string;
  className: string;
};

export function getMacrosLayoutCopy(): MacrosLayoutCopy {
  return {
    builderTitle: "Macro builder",
    libraryTitle: "Macro library",
  };
}

export function getMacroRowStatus(enabled: boolean): MacroRowStatus {
  return enabled
    ? { label: "Active", className: "macro-status active" }
    : { label: "Paused", className: "macro-status paused" };
}
