import { ClipboardList, Plus } from "lucide-react";

export function EditorEmptyState({ onCreate, onUseTemplate }: { onCreate: () => void; onUseTemplate: () => void }) {
  return (
    <div className="empty-state editor-empty-state">
      <h2>No document selected</h2>
      <p>Create a blank document or choose a template to start writing.</p>
      <div className="button-row">
        <button className="primary" onClick={onCreate}><Plus size={16} /> Create document</button>
        <button onClick={onUseTemplate}><ClipboardList size={16} /> Use template</button>
      </div>
    </div>
  );
}
