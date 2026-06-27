import { DocumentRecord } from "../../lib/api";

export type DocumentSortMode = "updated-desc" | "title-asc" | "created-desc";

export const ALL_DOCUMENT_CATEGORIES = "all";

export function getDocumentCategories(documents: DocumentRecord[]): string[] {
  return Array.from(new Set(documents.map((document) => document.category?.trim()).filter(Boolean) as string[])).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

export function documentMatchesFilters(document: DocumentRecord, searchText: string, category: string): boolean {
  const normalizedSearch = searchText.trim().toLowerCase();
  const matchesCategory = category === ALL_DOCUMENT_CATEGORIES || document.category === category;
  if (!matchesCategory) return false;
  if (!normalizedSearch) return true;
  return `${document.title} ${document.category ?? ""}`.toLowerCase().includes(normalizedSearch);
}

export function sortDocuments(documents: DocumentRecord[], sortMode: DocumentSortMode): DocumentRecord[] {
  return [...documents].sort((first, second) => {
    if (sortMode === "title-asc") {
      return first.title.localeCompare(second.title, undefined, { sensitivity: "base" });
    }
    if (sortMode === "created-desc") {
      return Date.parse(second.created_at) - Date.parse(first.created_at);
    }
    return Date.parse(second.updated_at) - Date.parse(first.updated_at);
  });
}

export function buildCopyTitle(title: string): string {
  const normalized = title.trim() || "Untitled document";
  return normalized.toLowerCase().endsWith(" copy") ? `${normalized} 2` : `${normalized} copy`;
}

export function formatDocumentDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
