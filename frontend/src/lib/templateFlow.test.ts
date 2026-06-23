import { describe, expect, it } from "vitest";
import {
  canSaveTemplateDraft,
  findTemplateVoiceCommand,
  normalizeTemplateDraft,
  removeTemplateById,
  routeTemplateVoiceCommand,
  shouldInsertTemplateVoiceCommand,
  getTemplateDocumentTitle,
  upsertTemplate,
} from "./templateFlow";

describe("template manager flow", () => {
  it("trims template names while preserving content", () => {
    expect(normalizeTemplateDraft({ name: "  Meeting minutes  ", content_html: "  <p>Agenda</p>  " })).toEqual({
      name: "Meeting minutes",
      content_html: "  <p>Agenda</p>  ",
    });
  });

  it("rejects drafts with empty names after trimming", () => {
    expect(canSaveTemplateDraft({ name: "   ", content_html: "<p>Agenda</p>" })).toBe(false);
  });

  it("uses the selected template name for a new document title", () => {
    expect(getTemplateDocumentTitle({ name: "  Meeting minutes  " })).toBe("Meeting minutes");
    expect(getTemplateDocumentTitle({ name: "   " })).toBe("Untitled document");
  });

  it("updates template records without using stale arrays", () => {
    const first = { id: 1, name: "one", content_html: "<p>first</p>", source_filename: null };
    const second = { id: 2, name: "two", content_html: "<p>second</p>", source_filename: null };

    const updated = upsertTemplate([first], second);
    const replaced = upsertTemplate(updated, { ...first, name: "changed" });
    const removed = removeTemplateById(replaced, second.id);

    expect(updated).toEqual([first, second]);
    expect(replaced).toEqual([{ ...first, name: "changed" }, second]);
    expect(removed).toEqual([{ ...first, name: "changed" }]);
  });

  it("finds voice template insertion commands case-insensitively and ignores punctuation", () => {
    const templates = [
      { id: 1, name: "Meeting minutes", content_html: "<p>Meeting</p>", source_filename: null },
      { id: 2, name: "Discharge Summary", content_html: "<p>Discharge</p>", source_filename: null },
    ];

    expect(findTemplateVoiceCommand("Insert template meeting minutes.", templates)?.id).toBe(1);
    expect(findTemplateVoiceCommand("Insert template meeting minutes,", templates)?.id).toBe(1);
    expect(findTemplateVoiceCommand("template meeting minutes:", templates)?.id).toBe(1);
    expect(findTemplateVoiceCommand("use template DISCHARGE summary", templates)?.id).toBe(2);
    expect(findTemplateVoiceCommand("get template DISCHARGE summary", templates)?.id).toBe(2);
    expect(findTemplateVoiceCommand("insert template missing", templates)).toBeNull();
  });

  it("matches template voice commands when saved names contain repeated whitespace", () => {
    const templates = [{ id: 1, name: "Meeting   minutes", content_html: "<p>Meeting</p>", source_filename: null }];

    expect(findTemplateVoiceCommand("Insert template meeting minutes", templates)?.id).toBe(1);
  });

  it("does not route template voice commands when voice commands are disabled", () => {
    const templates = [{ id: 1, name: "Meeting minutes", content_html: "<p>Meeting</p>", source_filename: null }];

    expect(routeTemplateVoiceCommand("Insert template meeting minutes", templates, { voiceCommandsEnabled: false })).toBeNull();
    expect(routeTemplateVoiceCommand("Insert template meeting minutes", templates, { voiceCommandsEnabled: true })?.id).toBe(1);
  });

  it("deduplicates repeated template voice commands inside a short window", () => {
    const recentCommands = new Map<string, number>();
    const template = { id: 1, name: "Meeting minutes", content_html: "<p>Meeting</p>", source_filename: null };

    expect(shouldInsertTemplateVoiceCommand(recentCommands, template, "insert template meeting minutes", 1_000)).toBe(true);
    expect(shouldInsertTemplateVoiceCommand(recentCommands, template, "insert template meeting minutes", 2_000)).toBe(false);
    expect(shouldInsertTemplateVoiceCommand(recentCommands, template, "insert template meeting minutes", 8_000)).toBe(true);
  });
});
