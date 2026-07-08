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
    ["next line", "insert-newline", "smart-editor"],
    ["new paragraph", "insert-paragraph", "smart-editor"],
    ["undo", "undo", "smart-editor"],
    ["redo", "redo", "smart-editor"],
    ["select all", "select-all", "smart-editor"],
    ["clear all", "clear-all", "smart-editor"],
    ["stop recording", "stop-dictation", "smart-editor"],
    ["delete last word", "delete-last-word", "smart-editor"],
    ["delete last sentence", "delete-last-sentence", "smart-editor"],
    ["save document", "save-document", "smart-editor"],
    ["start bold", "start-bold", "smart-editor"],
    ["stop bold", "stop-bold", "smart-editor"],
    ["start italic", "start-italic", "smart-editor"],
    ["stop italic", "stop-italic", "smart-editor"],
    ["start underline", "start-underline", "smart-editor"],
    ["stop underline", "stop-underline", "smart-editor"],
    ["start upper case", "start-upper-case", "smart-editor"],
    ["stop upper case", "stop-upper-case", "smart-editor"],
    ["start lower case", "start-lower-case", "smart-editor"],
    ["stop lower case", "stop-lower-case", "smart-editor"],
    ["start bullet list", "start-bullet-list", "smart-editor"],
    ["stop bullet list", "stop-bullet-list", "smart-editor"],
    ["start numbered list", "start-numbered-list", "smart-editor"],
    ["stop numbered list", "stop-numbered-list", "smart-editor"],
    ["start heading", "start-heading", "smart-editor"],
    ["stop heading", "stop-heading", "smart-editor"],
    ["start paragraph", "start-paragraph", "smart-editor"],
    ["normal text", "start-paragraph", "smart-editor"],
    ["start quote", "start-quote", "smart-editor"],
    ["stop quote", "stop-quote", "smart-editor"],
    ["start code block", "start-code-block", "smart-editor"],
    ["stop code block", "stop-code-block", "smart-editor"],
    ["insert horizontal rule", "insert-horizontal-rule", "smart-editor"],
    ["clear formatting", "clear-formatting", "smart-editor"],
    ["new line", "insert-newline", "variant"],
    ["newline", "insert-newline", "variant"],
    ["line break", "insert-newline", "variant"],
    ["new para", "insert-paragraph", "variant"],
    ["next paragraph", "insert-paragraph", "variant"],
    ["select everything", "select-all", "variant"],
    ["clear everything", "clear-all", "variant"],
    ["stop dictation", "stop-dictation", "variant"],
    ["pause recording", "stop-dictation", "variant"],
    ["scratch that", "scratch-that", "variant"],
    ["delete previous word", "delete-last-word", "variant"],
    ["undo that", "undo", "variant"],
    ["redo that", "redo", "variant"],
    ["bold", "start-bold", "variant"],
    ["bold on", "start-bold", "variant"],
    ["turn on bold", "start-bold", "variant"],
    ["bold off", "stop-bold", "variant"],
    ["turn off bold", "stop-bold", "variant"],
    ["italic", "start-italic", "variant"],
    ["italic on", "start-italic", "variant"],
    ["turn on italic", "start-italic", "variant"],
    ["italic off", "stop-italic", "variant"],
    ["turn off italic", "stop-italic", "variant"],
    ["underline", "start-underline", "variant"],
    ["underline on", "start-underline", "variant"],
    ["turn on underline", "start-underline", "variant"],
    ["underline off", "stop-underline", "variant"],
    ["start uppercase", "start-upper-case", "variant"],
    ["uppercase on", "start-upper-case", "variant"],
    ["all caps on", "start-upper-case", "variant"],
    ["uppercase off", "stop-upper-case", "variant"],
    ["all caps off", "stop-upper-case", "variant"],
    ["start lowercase", "start-lower-case", "variant"],
    ["lowercase on", "start-lower-case", "variant"],
    ["lowercase off", "stop-lower-case", "variant"],
    ["start bullet", "start-bullet-list", "variant"],
    ["start bullets", "start-bullet-list", "variant"],
    ["bullets on", "start-bullet-list", "variant"],
    ["stop bullets", "stop-bullet-list", "variant"],
    ["end bullets", "stop-bullet-list", "variant"],
    ["start numbers", "start-numbered-list", "variant"],
    ["numbered list on", "start-numbered-list", "variant"],
    ["stop numbers", "stop-numbered-list", "variant"],
    ["end numbered list", "stop-numbered-list", "variant"],
    ["heading on", "start-heading", "variant"],
    ["make heading", "start-heading", "variant"],
    ["normal heading off", "stop-heading", "variant"],
    ["plain text", "start-paragraph", "variant"],
    ["paragraph mode", "start-paragraph", "variant"],
    ["normal paragraph", "start-paragraph", "variant"],
    ["start block quote", "start-quote", "variant"],
    ["quote on", "start-quote", "variant"],
    ["stop block quote", "stop-quote", "variant"],
    ["quote off", "stop-quote", "variant"],
    ["start code", "start-code-block", "variant"],
    ["code block on", "start-code-block", "variant"],
    ["stop code", "stop-code-block", "variant"],
    ["code block off", "stop-code-block", "variant"],
    ["insert line", "insert-horizontal-rule", "variant"],
    ["horizontal line", "insert-horizontal-rule", "variant"],
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
