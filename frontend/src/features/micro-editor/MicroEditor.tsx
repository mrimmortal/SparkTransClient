import { WorkspaceContext } from "../workspace/types";

export function MicroEditor({ context }: { context: WorkspaceContext }) {
  return (
    <section className="micro-editor">
      <header>
        <strong>Micro Editor</strong>
        <button onClick={() => context.setMicroOpen(false)}>Close</button>
      </header>
      <textarea value={context.microText} onChange={(event) => context.setMicroText(event.target.value)} />
      <button onClick={() => context.editor?.chain().focus().insertContent(`${context.microText} `).run()}>Move to Smart Editor</button>
    </section>
  );
}
