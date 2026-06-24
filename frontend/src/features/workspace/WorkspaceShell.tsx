import { Activity, ClipboardList, FileText, HeartPulse, LogOut, Plus, Settings, Wand2 } from "lucide-react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { DiagnosticsPage } from "../diagnostics/DiagnosticsPage";
import { DocumentsPage } from "../documents/DocumentsPage";
import { MacrosPage } from "../macros/MacrosPage";
import { MicroEditor } from "../micro-editor/MicroEditor";
import { SettingsPage } from "../settings/SettingsPage";
import { TemplatesPage } from "../templates/TemplatesPage";
import { WorkspaceContext } from "./types";

export function WorkspaceShell({ context }: { context: WorkspaceContext }) {
  return (
    <main className="workspace">
      <aside className="sidebar">
        <div className="brand">SparkTrans</div>
        <nav>
          <NavLink to="/documents" className={({ isActive }) => (isActive ? "nav active" : "nav")}><FileText size={16} /> Documents</NavLink>
          <NavLink to="/templates" className={({ isActive }) => (isActive ? "nav active" : "nav")}><ClipboardList size={16} /> Templates</NavLink>
          <NavLink to="/macros" className={({ isActive }) => (isActive ? "nav active" : "nav")}><Wand2 size={16} /> Macros</NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? "nav active" : "nav")}><Settings size={16} /> Settings</NavLink>
          <NavLink to="/diagnostics" className={({ isActive }) => (isActive ? "nav active" : "nav")}><HeartPulse size={16} /> Diagnostics</NavLink>
        </nav>
        <button className="full secondary" onClick={() => void context.newDocument()} disabled={Boolean(context.busy)}>
          <Plus size={16} /> New document
        </button>
        <div className="document-list">
          {context.documents.map((document) => (
            <button key={document.id} className={document.id === context.activeDocument?.id ? "doc active" : "doc"} onClick={() => context.setActiveDocument(document)}>
              {document.title}
            </button>
          ))}
        </div>
        <button className="full secondary" onClick={() => void context.logout()}>
          <LogOut size={16} /> Sign out
        </button>
      </aside>

      <section className="main-panel">
        {context.warning && <div className="banner warning workspace-warning">{context.warning}</div>}
        {context.busy && <div className="status-row"><span className="status">{context.busy}</span></div>}
        <Routes>
          <Route path="/" element={<Navigate to="/documents" replace />} />
          <Route path="/documents" element={<DocumentsPage context={context} />} />
          <Route path="/templates" element={<TemplatesPage context={context} />} />
          <Route path="/macros" element={<MacrosPage context={context} />} />
          <Route path="/settings" element={<SettingsPage context={context} />} />
          <Route path="/diagnostics" element={<DiagnosticsPage context={context} />} />
          <Route path="*" element={<Navigate to="/documents" replace />} />
        </Routes>
      </section>

      {context.microOpen && <MicroEditor context={context} />}
    </main>
  );
}
