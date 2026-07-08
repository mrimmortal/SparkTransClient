import { Editor } from "@tiptap/react";
import {
  Bold,
  Code2,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  RemoveFormatting,
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
      {editorToolbarItems.map((item) => (
        <button
          key={item.command}
          type="button"
          className={isToolbarCommandActive(item.command) ? "icon-button active" : "icon-button"}
          aria-label={item.label}
          onClick={() => runToolbarCommand(item.command)}
          disabled={disabled}
        >
          {renderToolbarIcon(item.command)}
        </button>
      ))}
    </div>
  );
}

function renderToolbarIcon(command: EditorToolbarCommand) {
  if (command === "bold") return <Bold size={16} />;
  if (command === "italic") return <Italic size={16} />;
  if (command === "underline") return <Underline size={16} />;
  if (command === "heading") return <Heading2 size={16} />;
  if (command === "paragraph") return <Pilcrow size={16} />;
  if (command === "bullet-list") return <List size={16} />;
  if (command === "ordered-list") return <ListOrdered size={16} />;
  if (command === "blockquote") return <Quote size={16} />;
  if (command === "code-block") return <Code2 size={16} />;
  if (command === "horizontal-rule") return <Minus size={16} />;
  if (command === "undo") return <Undo2 size={16} />;
  if (command === "redo") return <Redo2 size={16} />;
  return <RemoveFormatting size={16} />;
}
