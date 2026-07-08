import { describe, expect, it } from "vitest";
import { buildDictationCommandGroups, getQuickActionLabel, getRightRailStatusTone } from "./rightRail";

describe("document right rail helpers", () => {
  it("groups dictation commands for chip rendering", () => {
    expect(
      buildDictationCommandGroups({
        formattingCommands: ["start bold / stop bold"],
        editorControls: ["next line"],
        templatePhrases: ["insert template <template name>"],
      }),
    ).toEqual([
      { title: "Formatting", commands: ["start bold / stop bold"] },
      { title: "Editing", commands: ["next line"] },
      { title: "Templates", commands: ["insert template <template name>"] },
    ]);
  });

  it("classifies right rail status pill tone", () => {
    expect(getRightRailStatusTone(true, false)).toBe("good");
    expect(getRightRailStatusTone(false, false)).toBe("warn");
    expect(getRightRailStatusTone(true, true)).toBe("active");
  });

  it("uses short quick action labels for the narrow right rail", () => {
    expect(getQuickActionLabel("date")).toBe("Date");
    expect(getQuickActionLabel("time")).toBe("Time");
    expect(getQuickActionLabel("clearSentence")).toBe("Clear sentence");
    expect(getQuickActionLabel("undo")).toBe("Undo");
  });
});
