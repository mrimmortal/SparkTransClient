import { Editor, Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export type RealtimeTranscriptPreviewState = {
  text: string;
  pos: number;
};

type RealtimeTranscriptPreviewMeta =
  | { type: "set"; text: string; pos: number }
  | { type: "clear" };

export const realtimeTranscriptPreviewPluginKey = new PluginKey<RealtimeTranscriptPreviewState | null>(
  "realtimeTranscriptPreview",
);

export function normalizeRealtimeTranscriptPreview(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function createRealtimeTranscriptPreviewState(text: string, pos: number): RealtimeTranscriptPreviewState | null {
  const normalized = normalizeRealtimeTranscriptPreview(text);
  if (!normalized) return null;
  return { text: normalized, pos };
}

export function setRealtimeTranscriptPreview(editor: Editor, text: string): void {
  const state = createRealtimeTranscriptPreviewState(text, editor.state.selection.from);
  const meta: RealtimeTranscriptPreviewMeta = state ? { type: "set", ...state } : { type: "clear" };
  dispatchRealtimeTranscriptPreviewMeta(editor, meta);
}

export function clearRealtimeTranscriptPreview(editor: Editor): void {
  dispatchRealtimeTranscriptPreviewMeta(editor, { type: "clear" });
}

export const RealtimeTranscriptPreview = Extension.create({
  name: "realtimeTranscriptPreview",

  addProseMirrorPlugins() {
    return [
      new Plugin<RealtimeTranscriptPreviewState | null>({
        key: realtimeTranscriptPreviewPluginKey,
        state: {
          init: () => null,
          apply(transaction, value) {
            const meta = transaction.getMeta(realtimeTranscriptPreviewPluginKey) as RealtimeTranscriptPreviewMeta | undefined;
            if (meta?.type === "clear") return null;
            if (meta?.type === "set") return createRealtimeTranscriptPreviewState(meta.text, meta.pos);
            if (value && transaction.docChanged) {
              return { ...value, pos: transaction.mapping.map(value.pos) };
            }
            return value;
          },
        },
        props: {
          decorations(state) {
            const preview = realtimeTranscriptPreviewPluginKey.getState(state);
            if (!preview) return null;
            const pos = Math.min(preview.pos, state.doc.content.size);
            const widget = document.createElement("span");
            widget.className = "realtime-transcript-preview";
            widget.textContent = preview.text;
            return DecorationSet.create(state.doc, [Decoration.widget(pos, widget, { side: 1 })]);
          },
        },
      }),
    ];
  },
});

function dispatchRealtimeTranscriptPreviewMeta(editor: Editor, meta: RealtimeTranscriptPreviewMeta): void {
  const transaction = editor.state.tr
    .setMeta(realtimeTranscriptPreviewPluginKey, meta)
    .setMeta("addToHistory", false);
  editor.view.dispatch(transaction);
}
