import { describe, expect, it } from "vitest";
import { createRealtimeTranscriptPreviewState, normalizeRealtimeTranscriptPreview } from "./realtimeTranscriptPreview";

describe("realtime transcript preview", () => {
  it("normalizes preview text for inline display", () => {
    expect(normalizeRealtimeTranscriptPreview("  live   words  ")).toBe("live words");
  });

  it("does not create preview state for blank realtime text", () => {
    expect(createRealtimeTranscriptPreviewState("   ", 4)).toBeNull();
  });

  it("keeps preview text and cursor position separate from document content", () => {
    expect(createRealtimeTranscriptPreviewState("draft text", 8)).toEqual({ text: "draft text", pos: 8 });
  });
});
