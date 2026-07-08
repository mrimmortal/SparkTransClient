import { describe, expect, it } from "vitest";
import { getWorkspaceBrand } from "./workspaceBrand";

describe("workspace brand", () => {
  it("uses a concise product lockup for the sidebar", () => {
    expect(getWorkspaceBrand()).toEqual({
      name: "NEXT LINE",
      subtitle: "Spark",
      mark: "N",
      ariaLabel: "Next Line Spark clinical dictation workspace",
    });
  });
});
