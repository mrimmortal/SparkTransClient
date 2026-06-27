import { describe, expect, it } from "vitest";
import { Schema } from "@tiptap/pm/model";
import { EditorState, Transaction } from "@tiptap/pm/state";
import {
  cancelTemplateMarkerNavigation,
  findTemplateMarkerRanges,
  getTemplateMarkerNavigationState,
  moveToFirstTemplateMarker,
  moveToFirstTemplateMarkerAtOrAfter,
  moveToNextTemplateMarker,
  moveToPreviousTemplateMarker,
  replaceSelectedTemplateMarker,
  skipTemplateMarker,
} from "./templateMarkerNavigation";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: {
      content: "inline*",
      group: "block",
      toDOM: () => ["p", 0],
    },
    text: { group: "inline" },
  },
  marks: {
    templatePlaceholderToken: {
      attrs: { name: { default: null } },
      toDOM: (mark) => ["span", { class: "template-placeholder-token", "data-template-placeholder": mark.attrs.name }, 0],
    },
  },
});

function marker(name: string) {
  return schema.marks.templatePlaceholderToken.create({ name });
}

function stateWithMarkers() {
  return EditorState.create({
    schema,
    doc: schema.nodes.doc.create(null, [
      schema.nodes.paragraph.create(null, [
        schema.text("Hello "),
        schema.text("{{first}}", [marker("first")]),
        schema.text(" and "),
        schema.text("{{second}}", [marker("second")]),
      ]),
    ]),
  });
}

function makeEditor(initialState: EditorState) {
  const editor = {
    state: initialState,
    view: {
      dispatch(transaction: Transaction) {
        editor.state = editor.state.apply(transaction);
      },
    },
    commands: {
      focus: () => true,
    },
  };
  return editor;
}

describe("template marker navigation", () => {
  it("finds template markers in document order", () => {
    expect(findTemplateMarkerRanges(stateWithMarkers()).map((range) => range.name)).toEqual(["first", "second"]);
  });

  it("moves to the first and next template marker", () => {
    const editor = makeEditor(stateWithMarkers());

    expect(moveToFirstTemplateMarker(editor)).toBe(true);
    expect(editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)).toBe("{{first}}");
    expect(moveToNextTemplateMarker(editor)).toBe(true);
    expect(editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)).toBe("{{second}}");
    expect(moveToNextTemplateMarker(editor)).toBe(false);
  });

  it("reports current marker progress", () => {
    const editor = makeEditor(stateWithMarkers());
    moveToFirstTemplateMarker(editor);

    expect(getTemplateMarkerNavigationState(editor.state)).toMatchObject({
      active: true,
      currentName: "first",
      currentIndex: 0,
      total: 2,
    });
  });

  it("moves to previous markers and skips without replacing text", () => {
    const editor = makeEditor(stateWithMarkers());

    moveToFirstTemplateMarker(editor);
    moveToNextTemplateMarker(editor);

    expect(moveToPreviousTemplateMarker(editor)).toBe(true);
    expect(editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)).toBe("{{first}}");
    expect(skipTemplateMarker(editor)).toBe(true);
    expect(editor.state.doc.textContent).toContain("{{first}}");
    expect(editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)).toBe("{{second}}");
  });

  it("cancels marker navigation by placing the cursor after the selected marker", () => {
    const editor = makeEditor(stateWithMarkers());
    moveToFirstTemplateMarker(editor);

    expect(cancelTemplateMarkerNavigation(editor)).toBe(true);
    expect(editor.state.selection.empty).toBe(true);
    expect(editor.state.selection.from).toBe(findTemplateMarkerRanges(editor.state)[0].to);
  });

  it("moves to the first template marker at or after a document position", () => {
    const editor = makeEditor(stateWithMarkers());
    const secondMarkerStart = findTemplateMarkerRanges(editor.state)[1].from;

    expect(moveToFirstTemplateMarkerAtOrAfter(editor, secondMarkerStart)).toBe(true);
    expect(editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)).toBe("{{second}}");
  });

  it("replaces only the selected template marker", () => {
    const editor = makeEditor(stateWithMarkers());

    moveToFirstTemplateMarker(editor);

    expect(replaceSelectedTemplateMarker(editor, "Alice")).toBe(true);
    expect(editor.state.doc.textContent).toContain("Hello Alice and {{second}}");
  });

  it("can auto-advance after replacement when requested", () => {
    const editor = makeEditor(stateWithMarkers());
    moveToFirstTemplateMarker(editor);

    expect(replaceSelectedTemplateMarker(editor, "Alice", { autoAdvance: true })).toBe(true);
    expect(editor.state.doc.textContent).toContain("Hello Alice and {{second}}");
    expect(editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)).toBe("{{second}}");
  });

  it("leaves ordinary dictation unchanged when no marker is selected", () => {
    const editor = makeEditor(EditorState.create({ schema, doc: schema.nodes.doc.create(null, [schema.nodes.paragraph.create(null, schema.text("Plain text"))]) }));

    expect(replaceSelectedTemplateMarker(editor, "Alice")).toBe(false);
    expect(editor.state.doc.textContent).toBe("Plain text");
  });
});
