import { Dispatch, SetStateAction } from "react";
import { Editor } from "@tiptap/react";
import {
  DocumentRecord,
  MacroRecord,
  ShortcutBindingRecord,
  TemplateRecord,
  UserRecord,
  UserSettingsRecord,
} from "../../lib/api";
import { ConnectionState } from "../../lib/corestt";

export type WorkspaceContext = {
  user: UserRecord;
  documents: DocumentRecord[];
  templates: TemplateRecord[];
  macros: MacroRecord[];
  settings: UserSettingsRecord;
  shortcuts: ShortcutBindingRecord[];
  activeDocument: DocumentRecord | null;
  editor: Editor | null;
  connectionState: ConnectionState;
  realtimeText: string;
  warning: string;
  busy: string;
  microOpen: boolean;
  microText: string;
  micStatus: string;
  audioPacketCount: number;
  audioSampleRate: number;
  retryAttempt: number;
  refreshWorkspace: () => Promise<void>;
  setWarning: (message: string) => void;
  setActiveDocument: (document: DocumentRecord | null) => void;
  setTemplates: Dispatch<SetStateAction<TemplateRecord[]>>;
  setMacros: Dispatch<SetStateAction<MacroRecord[]>>;
  setSettings: (settings: UserSettingsRecord) => void;
  setShortcuts: (shortcuts: ShortcutBindingRecord[]) => void;
  setMicroOpen: (open: boolean) => void;
  setMicroText: Dispatch<SetStateAction<string>>;
  newDocument: () => Promise<void>;
  createManagedDocument: (payload: { title: string; category: string | null; templateId: number | null }) => Promise<void>;
  saveDocument: () => Promise<void>;
  deleteDocument: () => Promise<void>;
  deleteDocumentById: (documentId: number) => Promise<void>;
  exportDocument: () => Promise<void>;
  exportDocumentById: (documentId: number) => Promise<void>;
  updateDocumentMetadata: (documentId: number, payload: { title: string; category: string | null }) => Promise<void>;
  duplicateDocument: (documentId: number) => Promise<void>;
  insertTemplate: (template: TemplateRecord) => Promise<void>;
  connectStt: () => void;
  startDictation: () => void;
  stopDictation: () => void;
  logout: () => Promise<void>;
};
