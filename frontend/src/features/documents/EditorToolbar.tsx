import { Editor } from "@tiptap/react";
import type { ReactNode } from "react";
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
  function runToolbarCommand(command: EditorToolbarCommand) {
    if (!editor) return;
    const chain = editor.chain().focus();
    if (command === "bold") chain.toggleBold().run();
    if (command === "italic") chain.toggleItalic().run();
    if (command === "underline") chain.toggleUnderline().run();
    if (command === "heading") chain.toggleHeading({ level: 2 }).run();
    if (command === "paragraph") chain.setParagraph().run();
    if (command === "bullet-list") chain.toggleBulletList().run();
    if (command === "ordered-list") chain.toggleOrderedList().run();
    if (command === "blockquote") chain.toggleBlockquote().run();
    if (command === "code-block") chain.toggleCodeBlock().run();
    if (command === "horizontal-rule") chain.setHorizontalRule().run();
    if (command === "undo") chain.undo().run();
    if (command === "redo") chain.redo().run();
    if (command === "clear-formatting") chain.unsetAllMarks().clearNodes().run();
  }

  function isToolbarCommandActive(command: EditorToolbarCommand): boolean {
    if (!editor) return false;
    if (command === "bold") return editor.isActive("bold");
    if (command === "italic") return editor.isActive("italic");
    if (command === "underline") return editor.isActive("underline");
    if (command === "heading") return editor.isActive("heading", { level: 2 });
    if (command === "paragraph") return editor.isActive("paragraph");
    if (command === "bullet-list") return editor.isActive("bulletList");
    if (command === "ordered-list") return editor.isActive("orderedList");
    if (command === "blockquote") return editor.isActive("blockquote");
    if (command === "code-block") return editor.isActive("codeBlock");
    return false;
  }

  return (
    <div className="editor-toolbar" aria-label="Editor toolbar">
      <div className="office-ribbon-body">
        <div className="editor-toolbar-group office-clipboard-group" role="group" aria-label="Clipboard">
          <span className="office-group-main office-clipboard-main">
            <button className="office-large-command" type="button" disabled>
              <Clipboard size={24} />
              <span>Paste</span>
            </button>
            <span className="office-command-stack">
              <button className="office-text-command" type="button" disabled><Scissors size={18} /> Cut</button>
              <button className="office-text-command" type="button" disabled><Copy size={18} /> Copy</button>
              <button className="office-text-command" type="button" disabled><Paintbrush size={18} /> Format painter</button>
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
              <select aria-label="Font family" disabled>
                <option>Inter</option>
              </select>
              <select aria-label="Font size" disabled>
                <option>11</option>
              </select>
            </span>
            <span className="editor-toolbar-group-actions office-command-row">
              {renderCommandButton("bold", runToolbarCommand, isToolbarCommandActive, disabled)}
              {renderCommandButton("italic", runToolbarCommand, isToolbarCommandActive, disabled)}
              {renderCommandButton("underline", runToolbarCommand, isToolbarCommandActive, disabled)}
              {renderDisabledIconButton("Strikethrough", <Strikethrough size={18} />)}
              {renderDisabledIconButton("Subscript", <Subscript size={18} />)}
              {renderDisabledIconButton("Superscript", <Superscript size={18} />)}
              {renderDisabledIconButton("Font color", <Text size={18} />)}
              {renderDisabledIconButton("Text highlight", <Highlighter size={18} />)}
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
              {renderDisabledIconButton("Align left", <AlignLeft size={18} />)}
              {renderDisabledIconButton("Align center", <AlignCenter size={18} />)}
              {renderDisabledIconButton("Align right", <AlignRight size={18} />)}
              {renderDisabledIconButton("Justify", <AlignJustify size={18} />)}
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
            {renderDisabledTile("Table", <Table2 size={18} />)}
            {renderDisabledTile("Image", <Image size={18} />)}
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

function renderDisabledIconButton(label: string, icon: ReactNode) {
  return (
    <button className="icon-button" type="button" aria-label={label} title={label} disabled>
      {icon}
    </button>
  );
}

function renderDisabledTile(label: string, icon: ReactNode) {
  return (
    <button className="office-tile-command" type="button" disabled>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function renderToolbarIcon(command: EditorToolbarCommand) {
  if (command === "bold") return <Bold size={18} />;
  if (command === "italic") return <Italic size={18} />;
  if (command === "underline") return <Underline size={18} />;
  if (command === "heading") return <Heading2 size={18} />;
  if (command === "paragraph") return <Pilcrow size={18} />;
  if (command === "bullet-list") return <List size={18} />;
  if (command === "ordered-list") return <ListOrdered size={18} />;
  if (command === "blockquote") return <Quote size={18} />;
  if (command === "code-block") return <Code2 size={18} />;
  if (command === "horizontal-rule") return <Minus size={18} />;
  if (command === "undo") return <Undo2 size={18} />;
  if (command === "redo") return <Redo2 size={18} />;
  return <RemoveFormatting size={18} />;
}
