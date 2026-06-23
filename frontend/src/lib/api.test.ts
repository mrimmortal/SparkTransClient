import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });

describe("api client", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends JSON requests with credentials", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 1, title: "Updated" }));

    await api.updateDocument(1, { title: "Updated" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/documents/1",
      expect.objectContaining({
        credentials: "include",
        method: "PATCH",
        headers: expect.objectContaining({ "content-type": "application/json" }),
        body: JSON.stringify({ title: "Updated" }),
      }),
    );
  });

  it("parses JSON error detail when available", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ detail: "Template not found" }, { status: 404 }));

    await expect(api.updateTemplate(9, { name: "Missing" })).rejects.toThrow("Template not found");
  });

  it("downloads PDF exports as blobs", async () => {
    const blob = new Blob(["pdf"], { type: "application/pdf" });
    fetchMock.mockResolvedValueOnce(new Response(blob, { status: 200, headers: { "content-type": "application/pdf" } }));

    const result = await api.exportDocumentPdf(2);

    expect(result.type).toBe("application/pdf");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/documents/2/export/pdf",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });

  it("uploads templates without forcing a JSON content type", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 3, name: "Template", content_html: "", source_filename: "template.docx" }));
    const file = new File(["docx"], "template.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    await api.uploadTemplate(file);

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.body).toBeInstanceOf(FormData);
    expect(init?.headers).toEqual({});
  });

  it("updates macro enabled state through the macro patch endpoint", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 4, trigger: "note", replacement: "memo", enabled: false }));

    await api.updateMacro(4, { enabled: false });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/macros/4",
      expect.objectContaining({
        credentials: "include",
        method: "PATCH",
        headers: expect.objectContaining({ "content-type": "application/json" }),
        body: JSON.stringify({ enabled: false }),
      }),
    );
  });

  it("encodes template search queries and deletes templates as void requests", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await api.searchTemplates("meeting minutes & follow-up");
    await api.deleteTemplate(8);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/templates/search?q=meeting%20minutes%20%26%20follow-up",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/templates/8",
      expect.objectContaining({ credentials: "include", method: "DELETE" }),
    );
  });
});
