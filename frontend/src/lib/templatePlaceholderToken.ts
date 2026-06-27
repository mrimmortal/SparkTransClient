import { Mark, mergeAttributes } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export const TemplatePlaceholderToken = Mark.create({
  name: "templatePlaceholderToken",

  addAttributes() {
    return {
      name: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-template-placeholder"),
        renderHTML: (attributes) => attributes.name ? { "data-template-placeholder": attributes.name } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "span.template-placeholder-token" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "template-placeholder-token" }), 0];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = [];
            const { from, to } = state.selection;
            state.doc.descendants((node, pos) => {
              if (!node.isText) return;
              if (pos !== from || pos + node.nodeSize !== to) return;
              if (!node.marks.some((mark) => mark.type.name === this.name)) return;
              decorations.push(Decoration.inline(pos, pos + node.nodeSize, { class: "template-placeholder-token-active" }));
            });
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
