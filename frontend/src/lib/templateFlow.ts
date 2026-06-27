import { TemplateRecord } from "./api";

export type TemplateDraft = Pick<TemplateRecord, "name" | "category" | "content_html">;

const TEMPLATE_VOICE_COMMAND_DEDUPE_MS = 5_000;
const TEMPLATE_PLACEHOLDER_PATTERN = /\{\{\s*([^{}]+?)\s*\}\}/g;

export function normalizeTemplateDraft(draft: TemplateDraft): TemplateDraft {
  return {
    name: draft.name.trim(),
    category: normalizeTemplateCategory(draft.category),
    content_html: draft.content_html,
  };
}

export function canSaveTemplateDraft(draft: TemplateDraft): boolean {
  return Boolean(normalizeTemplateDraft(draft).name);
}

export function getTemplateDocumentTitle(template: Pick<TemplateRecord, "name">): string {
  return template.name.trim() || "Untitled document";
}

export function upsertTemplate(templates: TemplateRecord[], template: TemplateRecord): TemplateRecord[] {
  if (!templates.some((item) => item.id === template.id)) {
    return [...templates, template];
  }
  return templates.map((item) => (item.id === template.id ? template : item));
}

export function removeTemplateById(templates: TemplateRecord[], id: number): TemplateRecord[] {
  return templates.filter((item) => item.id !== id);
}

export function getTemplateSelectionForListChange(
  templates: TemplateRecord[],
  current: TemplateRecord | null,
  previousTemplates: TemplateRecord[],
): TemplateRecord | null {
  if (!current) return templates[0] ?? null;
  const next = templates.find((template) => template.id === current.id) ?? null;
  if (!next) return templates[0] ?? null;
  const previous = previousTemplates.find((template) => template.id === current.id) ?? null;
  return previous === next ? current : next;
}

export function findTemplateVoiceCommand(text: string, templates: TemplateRecord[]): TemplateRecord | null {
  const normalized = normalizeTemplateCommand(text);
  const match = /^(?:insert|use|get)\s+template\s+(.+)$/.exec(normalized) ?? /^template\s+(.+)$/.exec(normalized);
  if (!match) return null;
  const requestedName = match[1];
  return templates.find((template) => normalizeTemplateName(template.name) === requestedName) ?? null;
}

export function routeTemplateVoiceCommand(
  text: string,
  templates: TemplateRecord[],
  options: { voiceCommandsEnabled: boolean },
): TemplateRecord | null {
  if (!options.voiceCommandsEnabled) return null;
  return findTemplateVoiceCommand(text, templates);
}

export function shouldInsertTemplateVoiceCommand(
  recentCommands: Map<string, number>,
  template: Pick<TemplateRecord, "id">,
  text: string,
  nowMs: number,
): boolean {
  const key = `${template.id}:${normalizeTemplateCommand(text)}`;
  const previousMs = recentCommands.get(key);
  recentCommands.set(key, nowMs);
  return previousMs === undefined || nowMs - previousMs > TEMPLATE_VOICE_COMMAND_DEDUPE_MS;
}

export function getTemplatePlaceholders(contentHtml: string): string[] {
  const placeholders: string[] = [];
  for (const match of contentHtml.matchAll(TEMPLATE_PLACEHOLDER_PATTERN)) {
    const name = match[1].trim();
    if (name && !placeholders.includes(name)) placeholders.push(name);
  }
  return placeholders;
}

export function highlightTemplatePlaceholders(contentHtml: string): string {
  const normalizedHtml = ensureTemplateHtml(contentHtml);
  return normalizedHtml.replace(TEMPLATE_PLACEHOLDER_PATTERN, (_match, rawName: string) => {
    const name = rawName.trim();
    const escapedName = escapeHtml(name);
    return `<span class="template-placeholder-token" data-template-placeholder="${escapedName}">{{${escapedName}}}</span>`;
  });
}

function ensureTemplateHtml(value: string): string {
  if (!value.trim()) return "";
  if (/<[a-z][\s\S]*>/i.test(value)) return value;
  return `<p>${escapeHtml(value)}</p>`;
}

function normalizeTemplateCommand(value: string): string {
  return normalizeTemplateName(value).replace(/\s+/g, " ");
}

function normalizeTemplateCategory(value: string | null): string | null {
  const normalized = value?.trim() ?? "";
  return normalized || null;
}

function normalizeTemplateName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
