import { describe, expect, it } from "vitest";
import {
  buildAvailableProfileNames,
  buildDomainProfilePayload,
  createNewDomainProfileDraft,
  filterDomainProfileNames,
  formatHotwords,
  getNextProfileNameAfterDelete,
} from "./domainProfileForm";

describe("domain profile form helpers", () => {
  it("normalizes empty prompts to null and splits comma/newline hotwords", () => {
    expect(
      buildDomainProfilePayload({
        initialPrompt: "  ",
        realtimePrompt: " Realtime hint ",
        hotwordsText: " hypertension, metformin\nfollow up ",
      }),
    ).toEqual({
      initial_prompt: null,
      initial_prompt_realtime: "Realtime hint",
      hotwords: ["hypertension", "metformin", "follow up"],
    });
  });

  it("formats hotwords from string, list, null, or missing values", () => {
    expect(formatHotwords(["alpha", " beta "])).toBe("alpha\nbeta");
    expect(formatHotwords("alpha, beta")).toBe("alpha, beta");
    expect(formatHotwords(null)).toBe("");
    expect(formatHotwords(undefined)).toBe("");
  });

  it("builds a sorted profile list including active and editing names", () => {
    expect(
      buildAvailableProfileNames({
        domainProfiles: ["support", "medical"],
        activeProfile: "general",
        editingName: "new_profile",
      }),
    ).toEqual(["general", "medical", "new_profile", "support"]);
  });

  it("filters profile names case-insensitively while preserving list order", () => {
    expect(filterDomainProfileNames(["general", "medical_radiology", "medical_cardiology", "support"], "RAD")).toEqual(["medical_radiology"]);
    expect(filterDomainProfileNames(["general", "medical"], "  ")).toEqual(["general", "medical"]);
  });

  it("creates an empty new profile draft with the default name", () => {
    expect(createNewDomainProfileDraft()).toEqual({
      name: "new_profile",
      draft: {
        initialPrompt: "",
        realtimePrompt: "",
        hotwordsText: "",
      },
    });
  });

  it("increments the default new profile name when it already exists", () => {
    expect(createNewDomainProfileDraft(["new_profile", "new_profile_2"])).toEqual({
      name: "new_profile_3",
      draft: {
        initialPrompt: "",
        realtimePrompt: "",
        hotwordsText: "",
      },
    });
  });

  it("selects a sensible next profile after delete", () => {
    expect(getNextProfileNameAfterDelete({ domainProfiles: ["general", "support"], activeProfile: "support" })).toBe("support");
    expect(getNextProfileNameAfterDelete({ domainProfiles: ["general"], activeProfile: "deleted" })).toBe("general");
    expect(getNextProfileNameAfterDelete({ domainProfiles: [], activeProfile: "deleted" })).toBe("general");
  });
});
