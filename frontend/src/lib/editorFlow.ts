export type SaveStatusInput = {
  dirty: boolean;
  saving: boolean;
};

export type EditorSaveInput = {
  hasActiveDocument: boolean;
  saving: boolean;
  text: string | null | undefined;
};

export type EditorToolbarCommand =
  | "bold"
  | "italic"
  | "underline"
  | "heading"
  | "paragraph"
  | "bullet-list"
  | "ordered-list"
  | "blockquote"
  | "code-block"
  | "horizontal-rule"
  | "undo"
  | "redo"
  | "clear-formatting";

export type EditorToolbarItem = {
  command: EditorToolbarCommand;
  label: string;
};

export type EditorTextMetrics = {
  words: number;
  characters: number;
};

type ChainRunner = {
  focus: () => ChainRunner;
  createParagraphNear?: () => ChainRunner;
  splitBlock?: () => ChainRunner;
  splitListItem?: (name: string) => ChainRunner;
  toggleBulletList?: () => ChainRunner;
  toggleOrderedList?: () => ChainRunner;
  run: () => boolean;
};

type ListModeEditor = {
  isActive: (name: string) => boolean;
  chain: () => ChainRunner;
};

type EnterLikeEditor = {
  isActive: (name: string) => boolean;
  chain: () => ChainRunner;
};

type HistoryChainRunner = {
  focus: () => HistoryChainRunner;
  undo: () => HistoryChainRunner;
  redo: () => HistoryChainRunner;
  run: () => boolean;
};

type HistoryEditor = {
  chain: () => HistoryChainRunner;
};

export const editorToolbarItems: EditorToolbarItem[] = [
  { command: "paragraph", label: "Paragraph" },
  { command: "heading", label: "Heading" },
  { command: "bold", label: "Bold" },
  { command: "italic", label: "Italic" },
  { command: "underline", label: "Underline" },
  { command: "clear-formatting", label: "Clear formatting" },
  { command: "bullet-list", label: "Bullet list" },
  { command: "ordered-list", label: "Numbered list" },
  { command: "blockquote", label: "Quote" },
  { command: "code-block", label: "Code block" },
  { command: "horizontal-rule", label: "Horizontal rule" },
  { command: "undo", label: "Undo" },
  { command: "redo", label: "Redo" },
];

export const confirmationMessages = {
  clearEditor: "Clear all editor content? This cannot be undone.",
  deleteDocument: "Delete this document? This cannot be undone.",
  deleteTemplate: "Delete this template? This cannot be undone.",
  deleteMacro: "Delete this macro? This cannot be undone.",
} as const;

export function getSaveStatusLabel(input: SaveStatusInput): string {
  if (input.saving) return "Saving...";
  return input.dirty ? "Unsaved changes" : "Saved";
}

export function canSaveEditorDocument(input: EditorSaveInput): boolean {
  return input.hasActiveDocument && !input.saving && Boolean(input.text?.trim());
}

export function getEditorTextMetrics(text: string | null | undefined): EditorTextMetrics {
  const value = text ?? "";
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  return {
    words,
    characters: value.length,
  };
}

export function formatEditorCountLabel(metrics: EditorTextMetrics): string {
  return `Words: ${metrics.words} · Characters: ${metrics.characters}`;
}

export function formatQuickActionDate(date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatQuickActionTime(date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function clearLastSentenceText(text: string): string {
  const trimmed = text.trimEnd();
  if (!trimmed) return "";
  const matches = [...trimmed.matchAll(/[.!?](?=\s|$)/g)];
  if (matches.length <= 1) return "";
  const previousEnd = matches[matches.length - 2].index;
  if (previousEnd === undefined) return "";
  return trimmed.slice(0, previousEnd + 1).trimEnd();
}

export function runListModeVoiceCommand(editor: ListModeEditor, listType: "bullet" | "ordered", action: "start" | "stop" = "start"): boolean {
  const activeName = listType === "bullet" ? "bulletList" : "orderedList";
  const toggle = listType === "bullet" ? "toggleBulletList" : "toggleOrderedList";
  const isActive = editor.isActive(activeName);

  if (action === "stop") {
    if (!isActive) return false;
    const chain = editor.chain().focus();
    const toggleList = chain[toggle];
    return toggleList ? toggleList.call(chain).run() : false;
  }

  if (isActive) return false;
  const chain = editor.chain().focus();
  if (!chain.createParagraphNear) return false;
  const listChain = chain.createParagraphNear();
  const toggleList = listChain[toggle];
  return toggleList ? toggleList.call(listChain).run() : false;
}

export function runEnterLikeVoiceCommand(editor: EnterLikeEditor): boolean {
  const chain = editor.chain().focus();
  if (editor.isActive("bulletList") || editor.isActive("orderedList")) {
    return chain.splitListItem ? chain.splitListItem("listItem").run() : false;
  }
  return chain.splitBlock ? chain.splitBlock().run() : false;
}

export function runHistoryVoiceCommand(editor: HistoryEditor, action: "undo" | "redo"): boolean {
  const chain = editor.chain().focus();
  return action === "undo" ? chain.undo().run() : chain.redo().run();
}
