import { ClipboardList, FileText, FolderOpen, HeartPulse, LogOut, Plus, Settings, Wand2 } from "lucide-react";
import { useState } from "react";
import { Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { DiagnosticsPage } from "../diagnostics/DiagnosticsPage";
import { DocumentManagementModal } from "../documents/DocumentManagementModal";
import { DocumentsPage } from "../documents/DocumentsPage";
import { formatDocumentDate } from "../documents/documentManagement";
import { MacrosPage } from "../macros/MacrosPage";
import { MicroEditor } from "../micro-editor/MicroEditor";
import { SettingsPage } from "../settings/SettingsPage";
import { TemplatesPage } from "../templates/TemplatesPage";
import { WorkspaceContext } from "./types";

export function WorkspaceShell({ context }: { context: WorkspaceContext }) {
  const navigate = useNavigate();
  const [documentManagerOpen, setDocumentManagerOpen] = useState(false);
  const recentDocuments = context.documents.slice(0, 5);

  function openDocument(document: WorkspaceContext["activeDocument"]) {
    if (!document) return;
    context.setActiveDocument(document);
    navigate("/documents");
  }

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
        <section className="sidebar-documents">
          <div className="sidebar-section-header">
            <span>Documents</span>
            <span>{context.documents.length}</span>
          </div>
          <div className="sidebar-document-actions">
            <button className="secondary" onClick={() => void context.newDocument()} disabled={Boolean(context.busy)}>
              <Plus size={16} /> New
            </button>
            <button className="secondary" onClick={() => setDocumentManagerOpen(true)}>
              <FolderOpen size={16} /> Manage
            </button>
          </div>
          <div className="document-list">
            {recentDocuments.length === 0 ? (
              <div className="sidebar-empty">No documents yet</div>
            ) : (
              recentDocuments.map((document) => (
                <button
                  key={document.id}
                  className={document.id === context.activeDocument?.id ? "doc active" : "doc"}
                  onClick={() => openDocument(document)}
                >
                  <span>{document.title}</span>
                  <small>{document.category || formatDocumentDate(document.updated_at)}</small>
                </button>
              ))
            )}
          </div>
        </section>
        <button className="full secondary sign-out-button" onClick={() => void context.logout()}>
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
      {documentManagerOpen && <DocumentManagementModal context={context} onClose={() => setDocumentManagerOpen(false)} />}
    </main>
  );
}
