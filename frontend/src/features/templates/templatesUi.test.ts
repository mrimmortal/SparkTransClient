import { describe, expect, it } from "vitest";
import { getTemplatesLayoutCopy } from "./templatesUi";

describe("templates UI helpers", () => {
  it("describes the Settings-style template workspace sections", () => {
    expect(getTemplatesLayoutCopy()).toEqual({
      libraryTitle: "Template library",
      editorTitle: "Template definition",
      previewTitle: "Preview",
    });
  });
});
