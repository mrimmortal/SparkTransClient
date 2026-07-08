import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CommandEmbeddingMatcher,
  COMMAND_SIMILARITY_THRESHOLD,
  cosineSimilarity,
  getAllCommandEntries,
} from "./commandEmbeddings";
import { routeFinalTextSemantic } from "./corestt";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it("returns -1 for opposite vectors", () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
  });

  it("handles zero vectors", () => {
    expect(cosineSimilarity([0, 0], [1, 0])).toBeCloseTo(0);
  });

  it("handles partial similarity", () => {
    const sim = cosineSimilarity([1, 1, 0], [1, 0, 0]);
    expect(sim).toBeCloseTo(1 / Math.SQRT2);
  });
});

describe("getAllCommandEntries", () => {
  it("returns the full command catalog", () => {
    expect(getAllCommandEntries().length).toBeGreaterThan(60);
  });

  it("each entry has trigger, command, and valid source", () => {
    for (const [trigger, command, source] of getAllCommandEntries()) {
      expect(typeof trigger).toBe("string");
      expect(trigger.length).toBeGreaterThan(0);
      expect(typeof command).toBe("string");
      expect(command.length).toBeGreaterThan(0);
      expect(["smart-editor", "variant", "template-marker"]).toContain(source);
    }
  });

  it("contains expected commands", () => {
    const entries = getAllCommandEntries();
    const commands = entries.map(([, cmd]) => cmd);
    expect(commands).toContain("insert-newline");
    expect(commands).toContain("stop-dictation");
    expect(commands).toContain("start-bold");
    expect(commands).toContain("stop-bold");
    expect(commands).toContain("start-upper-case");
    expect(commands).toContain("stop-lower-case");
    expect(commands).toContain("start-bullet-list");
    expect(commands).toContain("stop-numbered-list");
    expect(commands).toContain("insert-horizontal-rule");
    expect(commands).toContain("next-template-field");
    expect(commands).toContain("scratch-that");
  });
});

describe("CommandEmbeddingMatcher initial state", () => {
  it("starts not ready with no load error", () => {
    const matcher = new CommandEmbeddingMatcher();
    expect(matcher.ready).toBe(false);
    expect(matcher.initializing).toBe(false);
    expect(matcher.loadError).toBeNull();
  });

  it("match returns null result when not ready", async () => {
    const matcher = new CommandEmbeddingMatcher();
    const result = await matcher.match("new line");
    expect(result.command).toBeNull();
    expect(result.similarity).toBe(0);
    expect(result.matchedTrigger).toBeNull();
    expect(result.source).toBeNull();
  });

  it("matchTemplate returns null when not ready", async () => {
    const matcher = new CommandEmbeddingMatcher();
    const result = await matcher.matchTemplate("meeting minutes", new Map(), []);
    expect(result.template).toBeNull();
    expect(result.similarity).toBe(0);
  });

  it("computeTemplateEmbeddings returns empty map when not ready", async () => {
    const matcher = new CommandEmbeddingMatcher();
    const result = await matcher.computeTemplateEmbeddings([{ id: 1, name: "Test", category: null, content_html: "", source_filename: null }]);
    expect(result.size).toBe(0);
  });
});

describe("CommandEmbeddingMatcher.matchEmbedding", () => {
  function createMatcherWithMockData(): CommandEmbeddingMatcher {
    const matcher = new CommandEmbeddingMatcher();
    (matcher as any)._ready = true;
    (matcher as any).commandEntries = new Map([
      ["next line", { command: "insert-newline", source: "smart-editor", embedding: [1, 0, 0] }],
      ["undo", { command: "undo", source: "smart-editor", embedding: [0, 1, 0] }],
      ["start bold", { command: "start-bold", source: "smart-editor", embedding: [0, 0, 1] }],
      ["next field", { command: "next-template-field", source: "template-marker", embedding: [0.7, 0.7, 0] }],
    ]);
    return matcher;
  }

  it("finds closest command by cosine similarity", () => {
    const matcher = createMatcherWithMockData();
    const result = matcher.matchEmbedding([0.9, 0.1, 0]);
    expect(result.command).toBe("insert-newline");
    expect(result.similarity).toBeGreaterThan(COMMAND_SIMILARITY_THRESHOLD);
  });

  it("returns null when no command meets threshold", () => {
    const matcher = createMatcherWithMockData();
    const result = matcher.matchEmbedding([-1, -1, -1]);
    expect(result.command).toBeNull();
    expect(result.similarity).toBeLessThan(COMMAND_SIMILARITY_THRESHOLD);
  });

  it("returns correct source and matchedTrigger", () => {
    const matcher = createMatcherWithMockData();
    const result = matcher.matchEmbedding([0.1, 0.9, 0]);
    expect(result.command).toBe("undo");
    expect(result.source).toBe("smart-editor");
    expect(result.matchedTrigger).toBe("undo");
  });

  it("prefers higher similarity when multiple commands are close", () => {
    const matcher = createMatcherWithMockData();
    const result = matcher.matchEmbedding([0.68, 0.68, 0]);
    expect(result.command).toBe("next-template-field");
  });
});

describe("routeFinalTextSemantic with mock matcher", () => {
  async function createReadyMatcher(): Promise<CommandEmbeddingMatcher> {
    const matcher = new CommandEmbeddingMatcher();
    (matcher as any)._ready = true;
    (matcher as any).extractor = async (text: string) => {
      if (text === "start bold") return { data: new Float32Array([0.95, 0.05, 0]) };
      if (text === "bold on") return { data: new Float32Array([0.85, 0.1, 0.05]) };
      if (text === "stop recording") return { data: new Float32Array([0.05, 0.05, 0.95]) };
      if (text === "stop dictation") return { data: new Float32Array([0.1, 0.85, 0.05]) };
      if (text === "next field") return { data: new Float32Array([0.45, 0.45, 0.45]) };
      return { data: new Float32Array([0, 0, 0]) };
    };
    (matcher as any).commandEntries = new Map([
      ["start bold", { command: "start-bold", source: "smart-editor", embedding: [1, 0, 0] }],
      ["bold on", { command: "start-bold", source: "variant", embedding: [0.8, 0.2, 0] }],
      ["stop recording", { command: "stop-dictation", source: "smart-editor", embedding: [0, 0, 1] }],
      ["stop dictation", { command: "stop-dictation", source: "variant", embedding: [0.1, 0.9, 0] }],
      ["next field", { command: "next-template-field", source: "template-marker", embedding: [0.5, 0.5, 0.5] }],
    ]);
    return matcher;
  }

  it("routes exact match as command", async () => {
    const matcher = await createReadyMatcher();
    const result = await routeFinalTextSemantic("start bold", "smart-editor", [], matcher, {
      voiceCommandsEnabled: true,
    });
    expect(result).toEqual({ kind: "command", command: "start-bold" });
  });

  it("routes semantic variant as command", async () => {
    const matcher = await createReadyMatcher();
    const result = await routeFinalTextSemantic("bold on", "smart-editor", [], matcher, {
      voiceCommandsEnabled: true,
    });
    expect(result).toEqual({ kind: "command", command: "start-bold" });
  });

  it("falls back to insert for non-command text", async () => {
    const matcher = await createReadyMatcher();
    const result = await routeFinalTextSemantic("the patient has a fever", "smart-editor", [], matcher, {
      voiceCommandsEnabled: true,
    });
    expect(result.kind).toBe("insert");
  });

  it("respects voiceCommandsEnabled setting", async () => {
    const matcher = await createReadyMatcher();
    const result = await routeFinalTextSemantic("start bold", "smart-editor", [], matcher, {
      voiceCommandsEnabled: false,
    });
    expect(result.kind).toBe("insert");
  });

  it("routes variant command only when variants enabled", async () => {
    const matcher = await createReadyMatcher();
    const withEnabled = await routeFinalTextSemantic("stop dictation", "smart-editor", [], matcher, {
      voiceCommandsEnabled: true,
      voiceCommandVariantsEnabled: true,
    });
    expect(withEnabled).toEqual({ kind: "command", command: "stop-dictation" });

    const withDisabled = await routeFinalTextSemantic("stop dictation", "smart-editor", [], matcher, {
      voiceCommandsEnabled: true,
      voiceCommandVariantsEnabled: false,
    });
    expect(withDisabled.kind).toBe("insert");
  });

  it("routes template-marker command when marker nav enabled on smart-editor", async () => {
    const matcher = await createReadyMatcher();
    const result = await routeFinalTextSemantic("next field", "smart-editor", [], matcher, {
      voiceCommandsEnabled: true,
      templateMarkerNavigationEnabled: true,
    });
    expect(result).toEqual({ kind: "command", command: "next-template-field" });
  });

  it("ignores template-marker command when marker nav disabled or target is micro", async () => {
    const matcher = await createReadyMatcher();
    const disabledNav = await routeFinalTextSemantic("next field", "smart-editor", [], matcher, {
      voiceCommandsEnabled: true,
      templateMarkerNavigationEnabled: false,
    });
    expect(disabledNav.kind).toBe("insert");

    const microTarget = await routeFinalTextSemantic("next field", "micro-editor", [], matcher, {
      voiceCommandsEnabled: true,
      templateMarkerNavigationEnabled: true,
    });
    expect(microTarget.kind).toBe("insert");
  });

  it("falls back to exact matching when matcher not ready", async () => {
    const matcher = new CommandEmbeddingMatcher();
    const result = await routeFinalTextSemantic("next line", "smart-editor", [], matcher, {
      voiceCommandsEnabled: true,
    });
    expect(result).toEqual({ kind: "command", command: "insert-newline" });
  });

  it("falls back to exact matching when matcher is null", async () => {
    const result = await routeFinalTextSemantic("next line", "smart-editor", [], null, {
      voiceCommandsEnabled: true,
    });
    expect(result).toEqual({ kind: "command", command: "insert-newline" });
  });

  it("falls back to exact matching for text without command match", async () => {
    const matcher = await createReadyMatcher();
    const result = await routeFinalTextSemantic("the patient has a fever", "smart-editor", [], matcher, {
      voiceCommandsEnabled: true,
    });
    expect(result.kind).toBe("insert");
    expect("text" in result && result.text).toBe("the patient has a fever");
  });

  it("expands macros in fallback path", async () => {
    const matcher = await createReadyMatcher();
    const macros = [{ trigger: "standard closing note", replacement: "Please review.", enabled: true }];
    const result = await routeFinalTextSemantic("standard closing note", "smart-editor", macros, matcher, {
      voiceCommandsEnabled: true,
      macrosEnabled: true,
    });
    expect(result).toEqual({ kind: "insert", text: "Please review." });
  });
});
