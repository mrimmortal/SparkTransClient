import type { TemplateRecord } from "./api";

export const COMMAND_SIMILARITY_THRESHOLD = 0.75;
export const TEMPLATE_NAME_SIMILARITY_THRESHOLD = 0.75;

type CommandSource = "smart-editor" | "variant" | "template-marker";

export type MatchResult = {
  command: string | null;
  similarity: number;
  matchedTrigger: string | null;
  source: CommandSource | null;
};

export type TemplateMatchResult = {
  template: TemplateRecord | null;
  similarity: number;
};

export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

export function getAllCommandEntries(): [string, string, CommandSource][] {
  return [
    ["new line", "insert-newline", "smart-editor"],
    ["new paragraph", "insert-paragraph", "smart-editor"],
    ["undo", "undo", "smart-editor"],
    ["redo", "redo", "smart-editor"],
    ["select all", "select-all", "smart-editor"],
    ["clear all", "clear-all", "smart-editor"],
    ["stop recording", "stop-dictation", "smart-editor"],
    ["delete last word", "delete-last-word", "smart-editor"],
    ["delete last sentence", "delete-last-sentence", "smart-editor"],
    ["save document", "save-document", "smart-editor"],
    ["bold", "bold", "smart-editor"],
    ["italic", "italic", "smart-editor"],
    ["underline", "underline", "smart-editor"],
    ["clear formatting", "clear-formatting", "smart-editor"],
    ["newline", "insert-newline", "variant"],
    ["new para", "insert-paragraph", "variant"],
    ["select everything", "select-all", "variant"],
    ["clear everything", "clear-all", "variant"],
    ["stop dictation", "stop-dictation", "variant"],
    ["pause recording", "stop-dictation", "variant"],
    ["scratch that", "scratch-that", "variant"],
    ["delete previous word", "delete-last-word", "variant"],
    ["undo that", "undo", "variant"],
    ["redo that", "redo", "variant"],
    ["next field", "next-template-field", "template-marker"],
    ["previous field", "previous-template-field", "template-marker"],
    ["first field", "first-template-field", "template-marker"],
    ["skip field", "skip-template-field", "template-marker"],
    ["cancel field navigation", "cancel-template-field-navigation", "template-marker"],
  ];
}

export class CommandEmbeddingMatcher {
  private extractor: any = null;
  private commandEntries: Map<string, { command: string; source: CommandSource; embedding: number[] }> = new Map();
  private _ready = false;
  private _loadError: Error | null = null;
  private _initializing = false;

  get ready(): boolean {
    return this._ready;
  }

  get loadError(): Error | null {
    return this._loadError;
  }

  get initializing(): boolean {
    return this._initializing;
  }

  async init(): Promise<void> {
    if (this._ready || this._initializing) return;
    this._initializing = true;
    try {
      const { pipeline } = await import("@huggingface/transformers");
      this.extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
      await this.precomputeCommandEmbeddings();
      this._ready = true;
    } catch (error) {
      this._loadError = error instanceof Error ? error : new Error(String(error));
    } finally {
      this._initializing = false;
    }
  }

  async embed(text: string): Promise<number[]> {
    if (!this.extractor) throw new Error("Model not loaded");
    const result = await this.extractor(text, { pooling: "mean", normalize: true });
    return Array.from(result.data);
  }

  private async precomputeCommandEmbeddings(): Promise<void> {
    const entries = getAllCommandEntries();
    for (const [trigger, command, source] of entries) {
      const embedding = await this.embed(trigger);
      this.commandEntries.set(trigger, { command, source, embedding });
    }
  }

  async match(text: string): Promise<MatchResult> {
    if (!this._ready || !this.extractor) {
      return { command: null, similarity: 0, matchedTrigger: null, source: null };
    }
    const inputEmbedding = await this.embed(text);
    return this.matchEmbedding(inputEmbedding);
  }

  matchEmbedding(inputEmbedding: number[]): MatchResult {
    let bestCommand: string | null = null;
    let bestSimilarity = 0;
    let bestTrigger: string | null = null;
    let bestSource: CommandSource | null = null;

    for (const [trigger, entry] of this.commandEntries) {
      const similarity = cosineSimilarity(inputEmbedding, entry.embedding);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestCommand = entry.command;
        bestTrigger = trigger;
        bestSource = entry.source;
      }
    }

    if (bestCommand && bestSimilarity >= COMMAND_SIMILARITY_THRESHOLD) {
      return { command: bestCommand, similarity: bestSimilarity, matchedTrigger: bestTrigger, source: bestSource };
    }
    return { command: null, similarity: bestSimilarity, matchedTrigger: null, source: null };
  }

  async computeTemplateEmbeddings(templates: TemplateRecord[]): Promise<Map<number, number[]>> {
    const result = new Map<number, number[]>();
    if (!this._ready || !this.extractor) return result;
    for (const template of templates) {
      const embedding = await this.embed(template.name.toLowerCase());
      result.set(template.id, embedding);
    }
    return result;
  }

  async matchTemplate(
    text: string,
    templateEmbeddings: Map<number, number[]>,
    templates: TemplateRecord[],
  ): Promise<TemplateMatchResult> {
    if (!this._ready || !this.extractor) {
      return { template: null, similarity: 0 };
    }
    const inputEmbedding = await this.embed(text);
    let bestTemplate: TemplateRecord | null = null;
    let bestSimilarity = 0;

    for (const template of templates) {
      const embedding = templateEmbeddings.get(template.id);
      if (!embedding) continue;
      const similarity = cosineSimilarity(inputEmbedding, embedding);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestTemplate = template;
      }
    }

    if (bestTemplate && bestSimilarity >= TEMPLATE_NAME_SIMILARITY_THRESHOLD) {
      return { template: bestTemplate, similarity: bestSimilarity };
    }
    return { template: null, similarity: bestSimilarity };
  }
}
