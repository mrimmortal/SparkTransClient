import { DictationHelpContent } from "../../lib/dictationFlow";

export type DictationCommandGroup = {
  title: string;
  commands: string[];
};

export type RightRailStatusTone = "active" | "good" | "warn";
export type QuickActionId = "date" | "time" | "clearSentence" | "undo";

const QUICK_ACTION_LABELS: Record<QuickActionId, string> = {
  date: "Date",
  time: "Time",
  clearSentence: "Clear sentence",
  undo: "Undo",
};

export function buildDictationCommandGroups(help: Pick<DictationHelpContent, "formattingCommands" | "editorControls" | "templatePhrases">): DictationCommandGroup[] {
  return [
    { title: "Formatting", commands: help.formattingCommands },
    { title: "Editing", commands: help.editorControls },
    { title: "Templates", commands: help.templatePhrases },
  ];
}

export function getRightRailStatusTone(connectionReady: boolean, microphoneActive: boolean): RightRailStatusTone {
  if (microphoneActive) return "active";
  return connectionReady ? "good" : "warn";
}

export function getQuickActionLabel(action: QuickActionId): string {
  return QUICK_ACTION_LABELS[action];
}
