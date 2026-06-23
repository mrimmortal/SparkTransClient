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

export const editorToolbarItems: EditorToolbarItem[] = [
  { command: "bold", label: "Bold" },
  { command: "italic", label: "Italic" },
  { command: "heading", label: "Heading" },
  { command: "paragraph", label: "Paragraph" },
  { command: "bullet-list", label: "Bullet list" },
  { command: "ordered-list", label: "Numbered list" },
  { command: "blockquote", label: "Quote" },
  { command: "code-block", label: "Code block" },
  { command: "horizontal-rule", label: "Horizontal rule" },
  { command: "undo", label: "Undo" },
  { command: "redo", label: "Redo" },
  { command: "clear-formatting", label: "Clear formatting" },
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
