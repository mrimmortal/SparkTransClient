import { describe, expect, it } from "vitest";
import { canSaveMacroDraft, normalizeMacroDraft, removeMacroById, upsertMacro } from "./macroFlow";

describe("macro manager flow", () => {
  it("trims macro drafts before create or save", () => {
    expect(normalizeMacroDraft({ trigger: "  standard closing note  ", replacement: "  Please review.  ", enabled: true })).toEqual({
      trigger: "standard closing note",
      replacement: "Please review.",
      enabled: true,
    });
  });

  it("rejects drafts with empty trigger or replacement after trimming", () => {
    expect(canSaveMacroDraft({ trigger: "   ", replacement: "Please review.", enabled: true })).toBe(false);
    expect(canSaveMacroDraft({ trigger: "standard closing note", replacement: "   ", enabled: true })).toBe(false);
  });

  it("updates macro records without using stale arrays", () => {
    const first = { id: 1, trigger: "one", replacement: "first", enabled: true };
    const second = { id: 2, trigger: "two", replacement: "second", enabled: true };

    const updated = upsertMacro([first], second);
    const replaced = upsertMacro(updated, { ...first, replacement: "changed", enabled: false });
    const removed = removeMacroById(replaced, second.id);

    expect(updated).toEqual([first, second]);
    expect(replaced).toEqual([{ ...first, replacement: "changed", enabled: false }, second]);
    expect(removed).toEqual([{ ...first, replacement: "changed", enabled: false }]);
  });
});
