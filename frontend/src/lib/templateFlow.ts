import { TemplateRecord } from "./api";

export type TemplateDraft = Pick<TemplateRecord, "name" | "content_html">;

const TEMPLATE_VOICE_COMMAND_DEDUPE_MS = 5_000;

export function normalizeTemplateDraft(draft: TemplateDraft): TemplateDraft {
  return {
    name: draft.name.trim(),
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

function normalizeTemplateCommand(value: string): string {
  return normalizeTemplateName(value).replace(/\s+/g, " ");
}

function normalizeTemplateName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
