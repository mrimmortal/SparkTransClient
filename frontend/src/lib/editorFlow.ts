import { findSentenceRanges } from "./editorVoiceCommands";

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
  | "strike"
  | "subscript"
  | "superscript"
  | "font-color"
  | "text-highlight"
  | "heading"
  | "paragraph"
  | "bullet-list"
  | "ordered-list"
  | "align-left"
  | "align-center"
  | "align-right"
  | "align-justify"
  | "blockquote"
  | "code-block"
  | "horizontal-rule"
  | "insert-table"
  | "insert-image"
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

export type ConfirmationDialogCopy = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
};

type ChainRunner = {
  focus: () => ChainRunner;
  createParagraphNear?: () => ChainRunner;
  insertContent?: (content: string) => ChainRunner;
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

type ParagraphEditor = {
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

type SelectAllChainRunner = {
  focus: () => SelectAllChainRunner;
  setTextSelection: (position: number | { from: number; to: number }) => SelectAllChainRunner;
  run: () => boolean;
};

type TextSelectionEditor = {
  state: {
    doc: {
      content: { size: number };
      descendants?: (callback: (node: { isTextblock?: boolean; isText?: boolean; nodeSize?: number; text?: string }, pos: number) => void) => void;
    };
    selection?: {
      from?: number;
      to?: number;
      empty?: boolean;
      $from?: {
        start: () => number;
        end?: () => number;
        parent?: { textContent: string };
        parentOffset?: number;
      };
    };
  };
  chain: () => SelectAllChainRunner;
};

type SelectAllEditor = TextSelectionEditor & {
  commands: { selectAll: () => unknown };
};

type ParagraphSelectionEditor = TextSelectionEditor & {
  state: TextSelectionEditor["state"];
};

const PARAGRAPH_INDENT = "\u00A0\u00A0\u00A0\u00A0";

export const editorToolbarItems: EditorToolbarItem[] = [
  { command: "paragraph", label: "Paragraph" },
  { command: "heading", label: "Heading" },
  { command: "bold", label: "Bold" },
  { command: "italic", label: "Italic" },
  { command: "underline", label: "Underline" },
  { command: "strike", label: "Strikethrough" },
  { command: "subscript", label: "Subscript" },
  { command: "superscript", label: "Superscript" },
  { command: "font-color", label: "Font color" },
  { command: "text-highlight", label: "Text highlight" },
  { command: "clear-formatting", label: "Clear formatting" },
  { command: "bullet-list", label: "Bullet list" },
  { command: "ordered-list", label: "Numbered list" },
  { command: "align-left", label: "Align left" },
  { command: "align-center", label: "Align center" },
  { command: "align-right", label: "Align right" },
  { command: "align-justify", label: "Justify" },
  { command: "blockquote", label: "Quote" },
  { command: "code-block", label: "Code block" },
  { command: "horizontal-rule", label: "Horizontal rule" },
  { command: "insert-table", label: "Insert table" },
  { command: "insert-image", label: "Insert image" },
  { command: "undo", label: "Undo" },
  { command: "redo", label: "Redo" },
];

export const confirmationMessages = {
  clearEditor: "Clear all editor content? This cannot be undone.",
  deleteDocument: "Delete this document? This cannot be undone.",
  deleteTemplate: "Delete this template? This cannot be undone.",
  deleteMacro: "Delete this macro? This cannot be undone.",
} as const;

export function getClearEditorConfirmationDialog(): ConfirmationDialogCopy {
  return {
    title: "Clear editor content?",
    message: confirmationMessages.clearEditor,
    confirmLabel: "Clear content",
    cancelLabel: "Cancel",
  };
}

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

export function runParagraphVoiceCommand(editor: ParagraphEditor): boolean {
  const chain = editor.chain().focus();
  const splitBlock = chain.splitBlock;
  const insertContent = chain.insertContent;
  if (!splitBlock || !insertContent) return false;
  return insertContent.call(splitBlock.call(chain), PARAGRAPH_INDENT).run();
}

export function runHistoryVoiceCommand(editor: HistoryEditor, action: "undo" | "redo"): boolean {
  const chain = editor.chain().focus();
  return action === "undo" ? chain.undo().run() : chain.redo().run();
}

export function runSelectAllVoiceCommand(editor: SelectAllEditor): boolean {
  const movedToEnd = editor.chain().focus().setTextSelection(editor.state.doc.content.size).run();
  editor.commands.selectAll();
  return movedToEnd;
}

export function moveCursorToLineStart(editor: ParagraphSelectionEditor): boolean {
  const start = editor.state.selection?.$from?.start?.();
  if (start === undefined) return false;
  return editor.chain().focus().setTextSelection(start).run();
}

export function moveCursorToLineEnd(editor: ParagraphSelectionEditor): boolean {
  const end = editor.state.selection?.$from?.end;
  if (!end) return false;
  return editor.chain().focus().setTextSelection(end()).run();
}

export function moveCursorToDocumentStart(editor: TextSelectionEditor): boolean {
  const start = editor.state.doc.content.size > 0 ? 1 : 0;
  return editor.chain().focus().setTextSelection(start).run();
}

export function moveCursorToDocumentEnd(editor: TextSelectionEditor): boolean {
  return editor.chain().focus().setTextSelection(editor.state.doc.content.size).run();
}

export function moveCursorBeforeTextInCurrentParagraph(editor: ParagraphSelectionEditor, text: string): boolean {
  return moveCursorToParagraphMatch(editor, text, "before");
}

export function moveCursorAfterTextInCurrentParagraph(editor: ParagraphSelectionEditor, text: string): boolean {
  return moveCursorToParagraphMatch(editor, text, "after");
}

export function selectCurrentParagraph(editor: ParagraphSelectionEditor): boolean {
  const start = editor.state.selection?.$from?.start?.();
  const end = editor.state.selection?.$from?.end?.();
  if (start === undefined || end === undefined) return false;
  return setTextSelection(editor, { from: start, to: end });
}

export function selectAdjacentParagraph(editor: ParagraphSelectionEditor, direction: "last" | "next"): boolean {
  const ranges = getTextblockRanges(editor);
  if (!ranges.length) return false;
  const currentIndex = getCurrentTextblockRangeIndex(editor, ranges);
  if (currentIndex < 0) return false;
  const targetIndex = direction === "last" ? currentIndex - 1 : currentIndex + 1;
  const target = ranges[targetIndex];
  if (!target) return false;
  return setTextSelection(editor, target);
}

export function selectCurrentSentence(editor: ParagraphSelectionEditor): boolean {
  const range = getCurrentSentenceRange(editor);
  if (!range) return false;
  return setTextSelection(editor, range);
}

export function selectAdjacentSentence(editor: ParagraphSelectionEditor, direction: "last" | "next", count = 1): boolean {
  if (count < 1) return false;
  const selection = getSentenceSelectionContext(editor);
  if (!selection) return false;
  const target = getAdjacentSentenceRange(selection.ranges, selection.currentIndex, direction, count);
  if (!target) return false;
  return setTextSelection(editor, {
    from: selection.paragraphStart + target.fromOffset,
    to: selection.paragraphStart + target.toOffset,
  });
}

export function selectCurrentCharacter(editor: TextSelectionEditor): boolean {
  const ranges = getCharacterRanges(editor);
  if (!ranges.length) return false;
  const selection = editor.state.selection;
  const anchor = selection?.empty === false && selection.from !== undefined && selection.to !== undefined
    ? Math.min(selection.from, selection.to)
    : (selection?.from ?? 0);
  const target = ranges.find((range) => range.from >= anchor) ?? null;
  if (!target) return false;
  return setTextSelection(editor, target);
}

export function selectAdjacentCharacter(editor: TextSelectionEditor, direction: "last" | "next", count = 1): boolean {
  if (count < 1) return false;
  const ranges = getCharacterRanges(editor);
  if (!ranges.length) return false;
  const selection = editor.state.selection;
  if (!selection || selection.from === undefined || selection.to === undefined) return false;
  if (direction === "last") {
    const endIndex = findPreviousCharacterIndex(ranges, selection.from);
    if (endIndex < 0) return false;
    const startIndex = endIndex - count + 1;
    if (startIndex < 0) return false;
    return setTextSelection(editor, { from: ranges[startIndex].from, to: ranges[endIndex].to });
  }
  const startIndex = findNextCharacterIndex(ranges, selection.to);
  if (startIndex < 0) return false;
  const endIndex = startIndex + count - 1;
  if (endIndex >= ranges.length) return false;
  return setTextSelection(editor, { from: ranges[startIndex].from, to: ranges[endIndex].to });
}

function moveCursorToParagraphMatch(
  editor: ParagraphSelectionEditor,
  text: string,
  position: "before" | "after",
): boolean {
  const searchText = text.trim().toLowerCase();
  if (!searchText) return false;
  const paragraph = editor.state.selection?.$from?.parent;
  if (!paragraph) return false;
  const paragraphText = paragraph.textContent;
  const matchIndex = paragraphText.toLowerCase().indexOf(searchText);
  if (matchIndex < 0) return false;
  const paragraphStart = editor.state.selection?.$from?.start?.();
  if (paragraphStart === undefined) return false;
  const target = paragraphStart + matchIndex + (position === "after" ? searchText.length : 0);
  return editor.chain().focus().setTextSelection(target).run();
}

function setTextSelection(editor: TextSelectionEditor, selection: { from: number; to: number }): boolean {
  return editor.chain().focus().setTextSelection(selection).run();
}

function getTextblockRanges(editor: TextSelectionEditor): { from: number; to: number }[] {
  const ranges: { from: number; to: number }[] = [];
  editor.state.doc.descendants?.((node, pos) => {
    if (!node.isTextblock || !node.nodeSize) return;
    ranges.push({ from: pos + 1, to: pos + node.nodeSize - 1 });
  });
  return ranges;
}

function getCurrentTextblockRangeIndex(editor: TextSelectionEditor, ranges: { from: number; to: number }[]): number {
  const head = editor.state.selection?.to;
  if (head === undefined) return -1;
  return ranges.findIndex((range) => head >= range.from && head <= range.to);
}

function getSentenceSelectionContext(editor: ParagraphSelectionEditor): {
  paragraphStart: number;
  ranges: { fromOffset: number; toOffset: number }[];
  currentIndex: number;
} | null {
  const paragraph = editor.state.selection?.$from?.parent;
  const paragraphStart = editor.state.selection?.$from?.start?.();
  if (!paragraph || paragraphStart === undefined) return null;
  const ranges = findSentenceRanges(paragraph.textContent);
  if (!ranges.length) return null;
  const absoluteHead = editor.state.selection?.to ?? editor.state.selection?.from ?? paragraphStart;
  const offset = Math.max(0, absoluteHead - paragraphStart);
  const currentIndex = ranges.findIndex((range) => offset >= range.fromOffset && offset <= range.toOffset);
  if (currentIndex < 0) return null;
  return { paragraphStart, ranges, currentIndex };
}

function getCurrentSentenceRange(editor: ParagraphSelectionEditor): { from: number; to: number } | null {
  const selection = getSentenceSelectionContext(editor);
  if (!selection) return null;
  const current = selection.ranges[selection.currentIndex];
  return {
    from: selection.paragraphStart + current.fromOffset,
    to: selection.paragraphStart + current.toOffset,
  };
}

function getAdjacentSentenceRange(
  ranges: { fromOffset: number; toOffset: number }[],
  currentIndex: number,
  direction: "last" | "next",
  count: number,
): { fromOffset: number; toOffset: number } | null {
  if (direction === "last") {
    const startIndex = currentIndex - count;
    const endIndex = currentIndex - 1;
    if (startIndex < 0 || endIndex < 0) return null;
    return { fromOffset: ranges[startIndex].fromOffset, toOffset: ranges[endIndex].toOffset };
  }
  const startIndex = currentIndex + 1;
  const endIndex = currentIndex + count;
  if (startIndex >= ranges.length || endIndex >= ranges.length) return null;
  return { fromOffset: ranges[startIndex].fromOffset, toOffset: ranges[endIndex].toOffset };
}

function getCharacterRanges(editor: TextSelectionEditor): { from: number; to: number }[] {
  const ranges: { from: number; to: number }[] = [];
  editor.state.doc.descendants?.((node, pos) => {
    if (!node.isText || !node.text) return;
    for (let index = 0; index < node.text.length; index += 1) {
      ranges.push({ from: pos + index, to: pos + index + 1 });
    }
  });
  return ranges;
}

function findPreviousCharacterIndex(ranges: { from: number; to: number }[], anchor: number): number {
  for (let index = ranges.length - 1; index >= 0; index -= 1) {
    if (ranges[index].to <= anchor) return index;
  }
  return -1;
}

function findNextCharacterIndex(ranges: { from: number; to: number }[], anchor: number): number {
  return ranges.findIndex((range) => range.from >= anchor);
}
