import { describe, expect, it } from "vitest";
import { getMicrophoneStatusTone } from "./settingsUi";

describe("settings UI helpers", () => {
  it("classifies microphone status copy for status badges", () => {
    expect(getMicrophoneStatusTone("Not checked")).toBe("idle");
    expect(getMicrophoneStatusTone("Microphone permission and capture are available.")).toBe("success");
    expect(getMicrophoneStatusTone("Permission denied")).toBe("danger");
    expect(getMicrophoneStatusTone("Microphone capture is not supported in this browser.")).toBe("danger");
  });
});
