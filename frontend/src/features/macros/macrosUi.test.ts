import { describe, expect, it } from "vitest";
import { getMacroRowStatus, getMacrosLayoutCopy } from "./macrosUi";

describe("macros UI helpers", () => {
  it("describes the Settings-style macro workspace sections", () => {
    expect(getMacrosLayoutCopy()).toEqual({
      builderTitle: "Macro builder",
      libraryTitle: "Macro library",
    });
  });

  it("builds compact row status copy for enabled and disabled macros", () => {
    expect(getMacroRowStatus(true)).toEqual({
      label: "Active",
      className: "macro-status active",
    });
    expect(getMacroRowStatus(false)).toEqual({
      label: "Paused",
      className: "macro-status paused",
    });
  });
});
