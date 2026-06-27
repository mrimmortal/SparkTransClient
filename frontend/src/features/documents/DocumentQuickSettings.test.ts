import { describe, expect, it } from "vitest";
import { DOCUMENT_QUICK_SETTINGS, DOCUMENT_QUICK_TARGETS } from "./DocumentQuickSettings";

describe("document quick settings", () => {
  it("keeps only active document workflow settings in the quick settings strip", () => {
    expect(DOCUMENT_QUICK_SETTINGS.map((setting) => setting.field)).toEqual([
      "voice_commands_enabled",
      "macros_enabled",
      "auto_connect_corestt",
      "autosave_enabled",
      "template_marker_navigation_enabled",
      "template_marker_auto_advance_enabled",
    ]);
  });

  it("offers the same dictation targets used by settings", () => {
    expect(DOCUMENT_QUICK_TARGETS).toEqual([
      { value: "smart-editor", label: "Smart" },
      { value: "micro-editor", label: "Micro" },
    ]);
  });
});
