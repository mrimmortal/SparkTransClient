import { describe, expect, it } from "vitest";
import { buildCopyTitle, documentMatchesFilters, getDocumentCategories, sortDocuments } from "./documentManagement";
import { DocumentRecord } from "../../lib/api";

const makeDocument = (overrides: Partial<DocumentRecord>): DocumentRecord => ({
  id: 1,
  title: "Document",
  category: null,
  content_json: "{}",
  content_html: "",
  created_at: "2026-01-01T00:00:00",
  updated_at: "2026-01-01T00:00:00",
  ...overrides,
});

describe("document management", () => {
  it("derives sorted categories from documents", () => {
    const documents = [
      makeDocument({ id: 1, category: "Clinical" }),
      makeDocument({ id: 2, category: null }),
      makeDocument({ id: 3, category: "Follow-up" }),
      makeDocument({ id: 4, category: "Clinical" }),
    ];

    expect(getDocumentCategories(documents)).toEqual(["Clinical", "Follow-up"]);
  });

  it("matches search text against title and category", () => {
    const document = makeDocument({ title: "Annual review", category: "Finance" });

    expect(documentMatchesFilters(document, "review", "all")).toBe(true);
    expect(documentMatchesFilters(document, "finance", "all")).toBe(true);
    expect(documentMatchesFilters(document, "missing", "all")).toBe(false);
    expect(documentMatchesFilters(document, "", "Clinical")).toBe(false);
  });

  it("sorts documents by updated time or title", () => {
    const older = makeDocument({ id: 1, title: "Zoo", updated_at: "2026-01-01T00:00:00" });
    const newer = makeDocument({ id: 2, title: "Alpha", updated_at: "2026-01-03T00:00:00" });

    expect(sortDocuments([older, newer], "updated-desc").map((item) => item.id)).toEqual([2, 1]);
    expect(sortDocuments([older, newer], "title-asc").map((item) => item.id)).toEqual([2, 1]);
  });

  it("builds copy titles without duplicating an existing copy suffix", () => {
    expect(buildCopyTitle("Visit note")).toBe("Visit note copy");
    expect(buildCopyTitle("Visit note copy")).toBe("Visit note copy 2");
  });
});
