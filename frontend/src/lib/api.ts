export type DocumentRecord = {
  id: number;
  title: string;
  content_json: string;
  content_html: string;
  created_at: string;
  updated_at: string;
};

export type TemplateRecord = {
  id: number;
  name: string;
  category: string | null;
  content_html: string;
  source_filename: string | null;
  created_at?: string;
};

export type MacroRecord = {
  id: number;
  trigger: string;
  replacement: string;
  enabled: boolean;
};

export type UserRecord = {
  id: number;
  email: string;
};

export type UserSettingsRecord = {
  audio_device_id: string | null;
  voice_commands_enabled: boolean;
  macros_enabled: boolean;
  default_editor_target: string;
  profile: string;
  auto_connect_corestt: boolean;
  autosave_enabled: boolean;
  autosave_interval_seconds: number;
  confirm_destructive_actions: boolean;
  duplicate_transcript_protection_enabled: boolean;
  duplicate_transcript_window_ms: number;
  ignore_blank_audio_enabled: boolean;
  voice_command_variants_enabled: boolean;
  default_template_id: number | null;
  show_microphone_status: boolean;
  template_marker_navigation_enabled: boolean;
  template_marker_auto_advance_enabled: boolean;
};

export type ShortcutBindingRecord = {
  id: number;
  action: string;
  shortcut: string;
  description: string;
};

export type HealthStatus = {
  ok: boolean;
};

export type VersionInfo = {
  app: string;
  version: string;
  environment: string;
};

export type PublicConfig = {
  appName: string;
  version: string;
  sttProxyUrl: string;
  sttProtocolVersion: string;
  audioFormat: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

type ResponseMode = "json" | "blob" | "void";

type RequestOptions = {
  responseMode?: ResponseMode;
  headers?: HeadersInit;
};

function jsonBody(value: unknown): RequestInit {
  return {
    body: JSON.stringify(value),
    headers: { "content-type": "application/json" },
  };
}

async function request<T>(path: string, init: RequestInit = {}, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: options.headers ?? init.headers ?? {},
    ...init,
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  if (response.status === 204 || options.responseMode === "void") {
    return undefined as T;
  }
  if (options.responseMode === "blob") {
    return response.blob() as Promise<T>;
  }
  return response.json() as Promise<T>;
}

async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `Request failed with ${response.status}`;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const body = (await response.json()) as { detail?: unknown; message?: unknown };
      const detail = body.detail ?? body.message;
      if (typeof detail === "string") return detail;
      if (Array.isArray(detail)) return detail.map(String).join(", ");
      if (detail) return JSON.stringify(detail);
    } catch {
      return fallback;
    }
  }
  const detail = await response.text();
  return detail || fallback;
}

export const api = {
  me: () => request<UserRecord>("/api/auth/me"),
  login: (email: string, password: string) => request<UserRecord>("/api/auth/login", { method: "POST", ...jsonBody({ email, password }) }),
  register: (email: string, password: string) => request<UserRecord>("/api/auth/register", { method: "POST", ...jsonBody({ email, password }) }),
  logout: () => request<void>("/api/auth/logout", { method: "POST" }, { responseMode: "void" }),
  documents: () => request<DocumentRecord[]>("/api/documents"),
  createDocument: (title: string, content_html = "") =>
    request<DocumentRecord>("/api/documents", { method: "POST", ...jsonBody({ title, content_json: "{}", content_html }) }),
  updateDocument: (id: number, payload: Partial<Pick<DocumentRecord, "title" | "content_json" | "content_html">>) =>
    request<DocumentRecord>(`/api/documents/${id}`, { method: "PATCH", ...jsonBody(payload) }),
  deleteDocument: (id: number) => request<void>(`/api/documents/${id}`, { method: "DELETE" }, { responseMode: "void" }),
  exportDocumentPdf: (id: number) => request<Blob>(`/api/documents/${id}/export/pdf`, { method: "POST" }, { responseMode: "blob" }),
  templates: () => request<TemplateRecord[]>("/api/templates"),
  createTemplate: (payload: Pick<TemplateRecord, "name" | "category" | "content_html">) =>
    request<TemplateRecord>("/api/templates", { method: "POST", ...jsonBody(payload) }),
  searchTemplates: (query: string) => request<TemplateRecord[]>(`/api/templates/search?q=${encodeURIComponent(query)}`),
  updateTemplate: (id: number, payload: Partial<Pick<TemplateRecord, "name" | "category" | "content_html">>) =>
    request<TemplateRecord>(`/api/templates/${id}`, { method: "PATCH", ...jsonBody(payload) }),
  deleteTemplate: (id: number) => request<void>(`/api/templates/${id}`, { method: "DELETE" }, { responseMode: "void" }),
  uploadTemplate: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<TemplateRecord>("/api/templates/upload", { method: "POST", body: form });
  },
  macros: () => request<MacroRecord[]>("/api/macros"),
  createMacro: (payload: Omit<MacroRecord, "id">) => request<MacroRecord>("/api/macros", { method: "POST", ...jsonBody(payload) }),
  updateMacro: (id: number, payload: Partial<Omit<MacroRecord, "id">>) =>
    request<MacroRecord>(`/api/macros/${id}`, { method: "PATCH", ...jsonBody(payload) }),
  deleteMacro: (id: number) => request<void>(`/api/macros/${id}`, { method: "DELETE" }, { responseMode: "void" }),
  settings: () => request<UserSettingsRecord>("/api/settings"),
  updateSettings: (payload: Partial<UserSettingsRecord>) => request<UserSettingsRecord>("/api/settings", { method: "PATCH", ...jsonBody(payload) }),
  shortcuts: () => request<ShortcutBindingRecord[]>("/api/shortcuts"),
  replaceShortcuts: (payload: Omit<ShortcutBindingRecord, "id">[]) =>
    request<ShortcutBindingRecord[]>("/api/shortcuts", { method: "PUT", ...jsonBody(payload) }),
  healthLive: () => request<HealthStatus>("/api/health/live"),
  healthReady: () => request<HealthStatus>("/api/health/ready"),
  version: () => request<VersionInfo>("/api/health/version"),
  config: () => request<PublicConfig>("/api/config"),
};
