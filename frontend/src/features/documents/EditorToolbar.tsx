import { Editor } from "@tiptap/react";
import { useState } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Clipboard,
  Code2,
  Copy,
  Heading2,
  Highlighter,
  Image,
  Italic,
  List,
  ListOrdered,
  Minus,
  Paintbrush,
  Pilcrow,
  Quote,
  Redo2,
  RemoveFormatting,
  Scissors,
  Strikethrough,
  Subscript,
  Superscript,
  Table2,
  Text,
  Underline,
  Undo2,
} from "lucide-react";
import { EditorToolbarCommand, editorToolbarItems } from "../../lib/editorFlow";

export function EditorToolbar({ editor, disabled }: { editor: Editor | null; disabled: boolean }) {
  const [formatSnapshot, setFormatSnapshot] = useState<EditorFormatSnapshot | null>(null);

  function runToolbarCommand(command: EditorToolbarCommand) {
    if (!editor) return;
    const chain = editor.chain().focus();
    if (command === "bold") chain.toggleBold().run();
    if (command === "italic") chain.toggleItalic().run();
    if (command === "underline") chain.toggleUnderline().run();
    if (command === "strike") chain.toggleStrike().run();
    if (command === "subscript") chain.toggleSubscript().run();
    if (command === "superscript") chain.toggleSuperscript().run();
    if (command === "font-color") chain.setColor("#1f6feb").run();
    if (command === "text-highlight") chain.toggleHighlight({ color: "#fff3a3" }).run();
    if (command === "heading") chain.toggleHeading({ level: 2 }).run();
    if (command === "paragraph") chain.setParagraph().run();
    if (command === "bullet-list") chain.toggleBulletList().run();
    if (command === "ordered-list") chain.toggleOrderedList().run();
    if (command === "align-left") chain.setTextAlign("left").run();
    if (command === "align-center") chain.setTextAlign("center").run();
    if (command === "align-right") chain.setTextAlign("right").run();
    if (command === "align-justify") chain.setTextAlign("justify").run();
    if (command === "blockquote") chain.toggleBlockquote().run();
    if (command === "code-block") chain.toggleCodeBlock().run();
    if (command === "horizontal-rule") chain.setHorizontalRule().run();
    if (command === "insert-table") chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    if (command === "insert-image") {
      const src = window.prompt("Image URL");
      if (src?.trim()) chain.setImage({ src: src.trim() }).run();
    }
    if (command === "undo") chain.undo().run();
    if (command === "redo") chain.redo().run();
    if (command === "clear-formatting") chain.unsetAllMarks().clearNodes().run();
  }

  async function runClipboardCommand(command: "paste" | "cut" | "copy") {
    if (!editor || disabled) return;
    if (command === "paste") {
      const text = await navigator.clipboard?.readText();
      if (text) editor.chain().focus().insertContent(text).run();
      return;
    }

    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, "\n");
    if (!text) return;
    await navigator.clipboard?.writeText(text);
    if (command === "cut") editor.chain().focus().deleteSelection().run();
  }

  function runFormatPainter() {
    if (!editor || disabled) return;
    if (!formatSnapshot) {
      setFormatSnapshot(getEditorFormatSnapshot(editor));
      return;
    }
    applyEditorFormatSnapshot(editor, formatSnapshot);
    setFormatSnapshot(null);
  }

  function applyFontFamily(fontFamily: string) {
    if (!editor || disabled) return;
    editor.chain().focus().setFontFamily(fontFamily).run();
  }

  function applyFontSize(fontSize: string) {
    if (!editor || disabled) return;
    editor.chain().focus().setMark("textStyle", { fontSize: `${fontSize}px` }).run();
  }

  function isToolbarCommandActive(command: EditorToolbarCommand): boolean {
    if (!editor) return false;
    if (command === "bold") return editor.isActive("bold");
    if (command === "italic") return editor.isActive("italic");
    if (command === "underline") return editor.isActive("underline");
    if (command === "strike") return editor.isActive("strike");
    if (command === "subscript") return editor.isActive("subscript");
    if (command === "superscript") return editor.isActive("superscript");
    if (command === "font-color") return editor.isActive("textStyle", { color: "#1f6feb" });
    if (command === "text-highlight") return editor.isActive("highlight");
    if (command === "heading") return editor.isActive("heading", { level: 2 });
    if (command === "paragraph") return editor.isActive("paragraph");
    if (command === "bullet-list") return editor.isActive("bulletList");
    if (command === "ordered-list") return editor.isActive("orderedList");
    if (command === "align-left") return editor.isActive({ textAlign: "left" });
    if (command === "align-center") return editor.isActive({ textAlign: "center" });
    if (command === "align-right") return editor.isActive({ textAlign: "right" });
    if (command === "align-justify") return editor.isActive({ textAlign: "justify" });
    if (command === "blockquote") return editor.isActive("blockquote");
    if (command === "code-block") return editor.isActive("codeBlock");
    return false;
  }

  return (
    <div className="editor-toolbar" aria-label="Editor toolbar">
      <div className="office-ribbon-body">
        <div className="editor-toolbar-group office-clipboard-group" role="group" aria-label="Clipboard">
          <span className="office-group-main office-clipboard-main">
            <button className="office-large-command" type="button" onClick={() => void runClipboardCommand("paste")} disabled={disabled}>
              <Clipboard size={24} />
              <span>Paste</span>
            </button>
            <span className="office-command-stack">
              <button className="office-text-command" type="button" onClick={() => void runClipboardCommand("cut")} disabled={disabled}><Scissors size={18} /> Cut</button>
              <button className="office-text-command" type="button" onClick={() => void runClipboardCommand("copy")} disabled={disabled}><Copy size={18} /> Copy</button>
              <button className={formatSnapshot ? "office-text-command active" : "office-text-command"} type="button" onClick={runFormatPainter} disabled={disabled}><Paintbrush size={18} /> Format painter</button>
            </span>
          </span>
          <span className="editor-toolbar-group-label">Clipboard</span>
        </div>

        <div className="editor-toolbar-group" role="group" aria-label="History">
          <span className="office-group-main office-history-actions">
            {renderLabeledCommandButton("undo", "Undo", runToolbarCommand, isToolbarCommandActive, disabled)}
            {renderLabeledCommandButton("redo", "Redo", runToolbarCommand, isToolbarCommandActive, disabled)}
          </span>
          <span className="editor-toolbar-group-label">Undo / Redo</span>
        </div>

        <div className="editor-toolbar-group office-font-group" role="group" aria-label="Font">
          <span className="office-group-main office-font-main">
            <span className="office-select-row">
              <select aria-label="Font family" onChange={(event) => applyFontFamily(event.target.value)} disabled={disabled} defaultValue="Inter">
                <option>Inter</option>
                <option>Arial</option>
                <option>Georgia</option>
                <option>Times New Roman</option>
                <option>Courier New</option>
              </select>
              <select aria-label="Font size" onChange={(event) => applyFontSize(event.target.value)} disabled={disabled} defaultValue="11">
                <option>10</option>
                <option>11</option>
                <option>12</option>
                <option>14</option>
                <option>16</option>
                <option>18</option>
                <option>24</option>
              </select>
            </span>
            <span className="editor-toolbar-group-actions office-command-row">
              {renderCommandButton("bold", runToolbarCommand, isToolbarCommandActive, disabled)}
              {renderCommandButton("italic", runToolbarCommand, isToolbarCommandActive, disabled)}
              {renderCommandButton("underline", runToolbarCommand, isToolbarCommandActive, disabled)}
              {renderCommandButton("strike", runToolbarCommand, isToolbarCommandActive, disabled)}
              {renderCommandButton("subscript", runToolbarCommand, isToolbarCommandActive, disabled)}
              {renderCommandButton("superscript", runToolbarCommand, isToolbarCommandActive, disabled)}
              {renderCommandButton("font-color", runToolbarCommand, isToolbarCommandActive, disabled)}
              {renderCommandButton("text-highlight", runToolbarCommand, isToolbarCommandActive, disabled)}
              {renderCommandButton("clear-formatting", runToolbarCommand, isToolbarCommandActive, disabled)}
            </span>
          </span>
          <span className="editor-toolbar-group-label">Font</span>
        </div>

        <div className="editor-toolbar-group office-paragraph-group" role="group" aria-label="Paragraph">
          <span className="office-group-main office-paragraph-rows">
            <span className="office-command-row">
              {renderCommandButton("paragraph", runToolbarCommand, isToolbarCommandActive, disabled)}
              {renderCommandButton("heading", runToolbarCommand, isToolbarCommandActive, disabled)}
              {renderCommandButton("bullet-list", runToolbarCommand, isToolbarCommandActive, disabled)}
              {renderCommandButton("ordered-list", runToolbarCommand, isToolbarCommandActive, disabled)}
            </span>
            <span className="office-command-row">
              {renderCommandButton("align-left", runToolbarCommand, isToolbarCommandActive, disabled)}
              {renderCommandButton("align-center", runToolbarCommand, isToolbarCommandActive, disabled)}
              {renderCommandButton("align-right", runToolbarCommand, isToolbarCommandActive, disabled)}
              {renderCommandButton("align-justify", runToolbarCommand, isToolbarCommandActive, disabled)}
            </span>
            <span className="office-command-row">
              {renderCommandButton("blockquote", runToolbarCommand, isToolbarCommandActive, disabled)}
              {renderCommandButton("code-block", runToolbarCommand, isToolbarCommandActive, disabled)}
              {renderCommandButton("horizontal-rule", runToolbarCommand, isToolbarCommandActive, disabled)}
            </span>
          </span>
          <span className="editor-toolbar-group-label">Paragraph</span>
        </div>

        <div className="editor-toolbar-group office-insert-group" role="group" aria-label="Insert">
          <span className="office-group-main editor-toolbar-group-actions">
            {renderTileCommand("insert-table", runToolbarCommand, disabled)}
            {renderTileCommand("insert-image", runToolbarCommand, disabled)}
          </span>
          <span className="editor-toolbar-group-label">Insert</span>
        </div>
      </div>
    </div>
  );
}

function renderCommandButton(
  command: EditorToolbarCommand,
  runToolbarCommand: (command: EditorToolbarCommand) => void,
  isToolbarCommandActive: (command: EditorToolbarCommand) => boolean,
  disabled: boolean,
) {
  const item = editorToolbarItems.find((toolbarItem) => toolbarItem.command === command);
  if (!item) return null;
  return (
    <button
      key={item.command}
      type="button"
      className={isToolbarCommandActive(item.command) ? "icon-button active" : "icon-button"}
      aria-label={item.label}
      title={item.label}
      onClick={() => runToolbarCommand(item.command)}
      disabled={disabled}
    >
      {renderToolbarIcon(item.command)}
    </button>
  );
}

function renderLabeledCommandButton(
  command: EditorToolbarCommand,
  label: string,
  runToolbarCommand: (command: EditorToolbarCommand) => void,
  isToolbarCommandActive: (command: EditorToolbarCommand) => boolean,
  disabled: boolean,
) {
  return (
    <button
      className={isToolbarCommandActive(command) ? "office-history-command active" : "office-history-command"}
      type="button"
      onClick={() => runToolbarCommand(command)}
      disabled={disabled}
    >
      {renderToolbarIcon(command)}
      <span>{label}</span>
    </button>
  );
}

function renderTileCommand(
  command: EditorToolbarCommand,
  runToolbarCommand: (command: EditorToolbarCommand) => void,
  disabled: boolean,
) {
  const item = editorToolbarItems.find((toolbarItem) => toolbarItem.command === command);
  if (!item) return null;
  return (
    <button className="office-tile-command" type="button" onClick={() => runToolbarCommand(command)} disabled={disabled}>
      {renderToolbarIcon(command)}
      <span>{item.label.replace("Insert ", "")}</span>
    </button>
  );
}

function renderToolbarIcon(command: EditorToolbarCommand) {
  if (command === "bold") return <Bold size={18} />;
  if (command === "italic") return <Italic size={18} />;
  if (command === "underline") return <Underline size={18} />;
  if (command === "strike") return <Strikethrough size={18} />;
  if (command === "subscript") return <Subscript size={18} />;
  if (command === "superscript") return <Superscript size={18} />;
  if (command === "font-color") return <Text size={18} />;
  if (command === "text-highlight") return <Highlighter size={18} />;
  if (command === "heading") return <Heading2 size={18} />;
  if (command === "paragraph") return <Pilcrow size={18} />;
  if (command === "bullet-list") return <List size={18} />;
  if (command === "ordered-list") return <ListOrdered size={18} />;
  if (command === "align-left") return <AlignLeft size={18} />;
  if (command === "align-center") return <AlignCenter size={18} />;
  if (command === "align-right") return <AlignRight size={18} />;
  if (command === "align-justify") return <AlignJustify size={18} />;
  if (command === "blockquote") return <Quote size={18} />;
  if (command === "code-block") return <Code2 size={18} />;
  if (command === "horizontal-rule") return <Minus size={18} />;
  if (command === "insert-table") return <Table2 size={18} />;
  if (command === "insert-image") return <Image size={18} />;
  if (command === "undo") return <Undo2 size={18} />;
  if (command === "redo") return <Redo2 size={18} />;
  return <RemoveFormatting size={18} />;
}

type EditorFormatSnapshot = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  color?: string;
  fontFamily?: string;
  fontSize?: string;
  highlight?: string;
  textAlign?: "left" | "center" | "right" | "justify";
};

function getEditorFormatSnapshot(editor: Editor): EditorFormatSnapshot {
  const textStyle = editor.getAttributes("textStyle");
  const highlight = editor.getAttributes("highlight");
  const paragraph = editor.getAttributes("paragraph");
  const heading = editor.getAttributes("heading");
  return {
    bold: editor.isActive("bold"),
    italic: editor.isActive("italic"),
    underline: editor.isActive("underline"),
    strike: editor.isActive("strike"),
    color: textStyle.color,
    fontFamily: textStyle.fontFamily,
    fontSize: textStyle.fontSize,
    highlight: highlight.color,
    textAlign: paragraph.textAlign ?? heading.textAlign,
  };
}

function applyEditorFormatSnapshot(editor: Editor, snapshot: EditorFormatSnapshot) {
  let chain = editor.chain().focus().unsetAllMarks();
  if (snapshot.bold) chain = chain.toggleBold();
  if (snapshot.italic) chain = chain.toggleItalic();
  if (snapshot.underline) chain = chain.toggleUnderline();
  if (snapshot.strike) chain = chain.toggleStrike();
  if (snapshot.color) chain = chain.setColor(snapshot.color);
  if (snapshot.fontFamily) chain = chain.setFontFamily(snapshot.fontFamily);
  if (snapshot.fontSize) chain = chain.setMark("textStyle", { fontSize: snapshot.fontSize });
  if (snapshot.highlight) chain = chain.toggleHighlight({ color: snapshot.highlight });
  if (snapshot.textAlign) chain = chain.setTextAlign(snapshot.textAlign);
  chain.run();
}
