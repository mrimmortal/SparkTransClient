import { describe, expect, it } from "vitest";
import { shouldSaveSettingImmediately } from "./settingsFlow";
import { defaultSettings } from "../workspace/defaultSettings";

describe("settings flow", () => {
  it("keeps every user setting as draft-only until Save is clicked", () => {
    for (const field of Object.keys(defaultSettings)) {
      expect(shouldSaveSettingImmediately(field as keyof typeof defaultSettings)).toBe(false);
    }
  });
});
