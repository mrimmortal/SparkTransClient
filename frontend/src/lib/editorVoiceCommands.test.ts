import { describe, expect, it } from "vitest";
import { getDeleteLastSentenceRange, getDeleteLastWordRange } from "./editorVoiceCommands";

describe("editor voice command helpers", () => {
  it("finds the previous word before the cursor", () => {
    expect(getDeleteLastWordRange("hello world", 11)).toEqual({ fromOffset: 6, toOffset: 11 });
  });

  it("includes trailing spaces when deleting the previous word", () => {
    expect(getDeleteLastWordRange("hello world   ", 14)).toEqual({ fromOffset: 6, toOffset: 14 });
  });

  it("does not delete when there is no previous word", () => {
    expect(getDeleteLastWordRange("   ", 3)).toBeNull();
  });

  it("finds the previous sentence before the cursor", () => {
    expect(getDeleteLastSentenceRange("First sentence. Second sentence", 31)).toEqual({ fromOffset: 16, toOffset: 31 });
  });

  it("deletes to the start of the textblock when no sentence boundary exists", () => {
    expect(getDeleteLastSentenceRange("Only one sentence", 17)).toEqual({ fromOffset: 0, toOffset: 17 });
  });

  it("does not delete a sentence when only whitespace is before the cursor", () => {
    expect(getDeleteLastSentenceRange("   ", 3)).toBeNull();
  });
});
