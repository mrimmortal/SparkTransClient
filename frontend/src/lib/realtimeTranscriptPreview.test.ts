import { describe, expect, it } from "vitest";
import {
  createRealtimeTranscriptPreviewState,
  normalizeRealtimeTranscriptPreview,
  splitRealtimeTranscriptPreview,
} from "./realtimeTranscriptPreview";

describe("realtime transcript preview", () => {
  it("normalizes preview text for inline display", () => {
    expect(normalizeRealtimeTranscriptPreview("  live   words  ")).toBe("live words");
  });

  it("does not create preview state for blank realtime text", () => {
    expect(createRealtimeTranscriptPreviewState("   ", 4)).toBeNull();
  });

  it("keeps preview text and cursor position separate from document content", () => {
    expect(createRealtimeTranscriptPreviewState("draft text", 8)).toEqual({
      text: "draft text",
      pos: 8,
      stableText: "",
      newText: "draft text",
    });
  });

  it("marks only newly appended words as fresh realtime text", () => {
    expect(splitRealtimeTranscriptPreview("patient reports", "patient reports chest pain")).toEqual({
      stableText: "patient reports",
      newText: "chest pain",
    });
  });

  it("does not mark repeated interim text as fresh", () => {
    expect(splitRealtimeTranscriptPreview("patient reports", "patient reports")).toEqual({
      stableText: "patient reports",
      newText: "",
    });
  });

  it("updates revised interim text without treating changed words as appended", () => {
    expect(splitRealtimeTranscriptPreview("patient report", "patient reports chest pain")).toEqual({
      stableText: "patient reports chest pain",
      newText: "",
    });
  });
});
