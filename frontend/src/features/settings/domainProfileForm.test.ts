import { describe, expect, it } from "vitest";
import { buildDomainProfilePayload, formatHotwords } from "./domainProfileForm";

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
});
