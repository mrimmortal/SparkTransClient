import { EditorState, TextSelection, Transaction } from "@tiptap/pm/state";

export type TemplateMarkerRange = {
  from: number;
  to: number;
  name: string;
};

export type TemplateMarkerNavigationState = {
  active: boolean;
  currentName: string | null;
  currentIndex: number;
  total: number;
};

export type ReplaceTemplateMarkerOptions = {
  autoAdvance?: boolean;
};

type TemplateMarkerEditor = {
  state: EditorState;
  view: { dispatch: (transaction: Transaction) => void };
  commands: { focus: () => unknown };
};

const TEMPLATE_MARK_NAME = "templatePlaceholderToken";

export function findTemplateMarkerRanges(state: EditorState): TemplateMarkerRange[] {
  const ranges: TemplateMarkerRange[] = [];
  state.doc.descendants((node, pos) => {
    if (!node.isText) return;
    const mark = node.marks.find((item) => item.type.name === TEMPLATE_MARK_NAME);
    if (!mark) return;
    ranges.push({
      from: pos,
      to: pos + node.nodeSize,
      name: String(mark.attrs.name ?? node.textContent.replace(/[{}]/g, "")),
    });
  });
  return ranges;
}

export function moveToFirstTemplateMarker(editor: TemplateMarkerEditor): boolean {
  const [first] = findTemplateMarkerRanges(editor.state);
  return selectTemplateMarker(editor, first);
}

export function moveToFirstTemplateMarkerAtOrAfter(editor: TemplateMarkerEditor, position: number): boolean {
  const marker = findTemplateMarkerRanges(editor.state).find((range) => range.from >= position);
  return selectTemplateMarker(editor, marker);
}

export function moveToNextTemplateMarker(editor: TemplateMarkerEditor): boolean {
  const ranges = findTemplateMarkerRanges(editor.state);
  const currentTo = editor.state.selection.to;
  const next = ranges.find((range) => range.from >= currentTo);
  return selectTemplateMarker(editor, next);
}

export function moveToPreviousTemplateMarker(editor: TemplateMarkerEditor): boolean {
  const ranges = findTemplateMarkerRanges(editor.state);
  const currentFrom = editor.state.selection.from;
  const previous = [...ranges].reverse().find((range) => range.to <= currentFrom);
  return selectTemplateMarker(editor, previous);
}

export function skipTemplateMarker(editor: TemplateMarkerEditor): boolean {
  return moveToNextTemplateMarker(editor);
}

export function cancelTemplateMarkerNavigation(editor: TemplateMarkerEditor): boolean {
  const { to } = editor.state.selection;
  const transaction = editor.state.tr.setSelection(TextSelection.create(editor.state.doc, to));
  editor.view.dispatch(transaction);
  editor.commands.focus();
  return true;
}

export function getTemplateMarkerNavigationState(state: EditorState): TemplateMarkerNavigationState {
  const ranges = findTemplateMarkerRanges(state);
  const selected = getSelectedTemplateMarkerRange(state);
  const currentIndex = selected ? ranges.findIndex((range) => range.from === selected.from && range.to === selected.to) : -1;
  return {
    active: Boolean(selected),
    currentName: selected?.name ?? null,
    currentIndex,
    total: ranges.length,
  };
}

export function replaceSelectedTemplateMarker(editor: TemplateMarkerEditor, text: string, options: ReplaceTemplateMarkerOptions = {}): boolean {
  const range = getSelectedTemplateMarkerRange(editor.state);
  if (!range) return false;
  editor.view.dispatch(editor.state.tr.delete(range.from, range.to).insertText(text, range.from));
  if (options.autoAdvance && moveToFirstTemplateMarkerAtOrAfter(editor, range.from + text.length)) return true;
  editor.commands.focus();
  return true;
}

function getSelectedTemplateMarkerRange(state: EditorState): TemplateMarkerRange | null {
  const { from, to } = state.selection;
  return findTemplateMarkerRanges(state).find((range) => range.from === from && range.to === to) ?? null;
}

function selectTemplateMarker(editor: TemplateMarkerEditor, range: TemplateMarkerRange | undefined): boolean {
  if (!range) return false;
  const transaction = editor.state.tr.setSelection(TextSelection.create(editor.state.doc, range.from, range.to));
  editor.view.dispatch(transaction);
  editor.commands.focus();
  return true;
}
