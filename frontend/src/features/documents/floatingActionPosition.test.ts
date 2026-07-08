import { describe, expect, it } from "vitest";
import { buildFloatingActionClassName, clampFloatingActionPosition, getDefaultFloatingActionPosition } from "./floatingActionPosition";

describe("floating action position", () => {
  it("defaults to the lower-right viewport corner with the configured margin", () => {
    expect(
      getDefaultFloatingActionPosition({
        viewport: { width: 1200, height: 800 },
        size: { width: 168, height: 46 },
        margin: 22,
      }),
    ).toEqual({ x: 1010, y: 732 });
  });

  it("clamps dragged positions inside the viewport", () => {
    expect(
      clampFloatingActionPosition({
        position: { x: 2000, y: -40 },
        viewport: { width: 390, height: 844 },
        size: { width: 168, height: 46 },
        margin: 12,
      }),
    ).toEqual({ x: 210, y: 12 });
  });

  it("marks the floating action as recording only while dictation is running", () => {
    expect(buildFloatingActionClassName({ disabled: false, recording: true })).toBe(
      "primary floating-transcription-action recording",
    );
    expect(buildFloatingActionClassName({ disabled: true, recording: true })).toBe(
      "primary floating-transcription-action disabled recording",
    );
    expect(buildFloatingActionClassName({ disabled: false, recording: false })).toBe("primary floating-transcription-action");
  });
});
