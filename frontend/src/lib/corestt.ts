export type DictationAudioSource = "desktop-mic" | "remote-mobile-mic";
export type EditorTarget = "smart-editor" | "micro-editor";
export type ConnectionState = "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "READY" | "STREAMING" | "STOPPING" | "CLOSED" | "ERROR";

export type AudioMetadata = {
  sampleRate: number;
  channels?: number;
  format?: "pcm_s16le";
  frames?: number;
  sentAt?: number;
  clientPlatform?: string;
  clientProtocolVersion?: string;
  sequence?: number;
};

export type TranscriptState = {
  realtimeBySegment: Record<number, string>;
  finalBySegment: Record<number, string>;
};

export type TranscriptEvent =
  | { type: "realtime"; segmentId: number; text?: string; displayText?: string }
  | { type: "final"; segmentId: number; text: string };

export type FinalRoute =
  | { kind: "command"; command: string }
  | { kind: "insert"; text: string };

export type TranscriptRoutingOptions = {
  voiceCommandsEnabled?: boolean;
  macrosEnabled?: boolean;
  voiceCommandVariantsEnabled?: boolean;
  templateMarkerNavigationEnabled?: boolean;
};

export type FinalTranscriptTextDedupeOptions = {
  enabled?: boolean;
  windowMs?: number;
};

const MAX_METADATA_BYTES = 64 * 1024;
const DEFAULT_MAX_PACKET_BYTES = 512 * 1024;
const FINAL_TRANSCRIPT_TEXT_DEDUPE_MS = 5_000;

export function validatePacket(metadata: AudioMetadata, audioBuffer: ArrayBuffer, maxPacketBytes = DEFAULT_MAX_PACKET_BYTES): void {
  const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata));
  if (metadataBytes.byteLength > MAX_METADATA_BYTES) {
    throw new Error("metadata exceeds 64 KiB");
  }
  if (4 + metadataBytes.byteLength + audioBuffer.byteLength > maxPacketBytes) {
    throw new Error("audio packet exceeds server limit");
  }
  if (!Number.isInteger(metadata.sampleRate) || metadata.sampleRate <= 0) {
    throw new Error("sampleRate must be a positive integer");
  }
  const channels = metadata.channels ?? 1;
  if (!Number.isInteger(channels) || channels <= 0 || channels > 8) {
    throw new Error("channels must be from 1 to 8");
  }
  if ((metadata.format ?? "pcm_s16le") !== "pcm_s16le") {
    throw new Error("format must be pcm_s16le");
  }
  if (audioBuffer.byteLength % (channels * 2) !== 0) {
    throw new Error("audio bytes must align to channels * 2");
  }
  if (metadata.frames !== undefined && metadata.frames * channels * 2 !== audioBuffer.byteLength) {
    throw new Error("frames must match audio payload size");
  }
}

export function buildAudioPacket(metadata: AudioMetadata, audioBuffer: ArrayBuffer): ArrayBuffer {
  validatePacket(metadata, audioBuffer);
  const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata));
  const packet = new ArrayBuffer(4 + metadataBytes.byteLength + audioBuffer.byteLength);
  const view = new DataView(packet);
  view.setUint32(0, metadataBytes.byteLength, true);
  new Uint8Array(packet, 4, metadataBytes.byteLength).set(metadataBytes);
  new Uint8Array(packet, 4 + metadataBytes.byteLength).set(new Uint8Array(audioBuffer));
  return packet;
}

export function floatToPcm16(floatSamples: Float32Array): Int16Array {
  const pcm = new Int16Array(floatSamples.length);
  for (let index = 0; index < floatSamples.length; index += 1) {
    const value = Math.max(-1, Math.min(1, floatSamples[index]));
    pcm[index] = value < 0 ? value * 32768 : value * 32767;
  }
  return pcm;
}

export function applyTranscriptEvent(state: Partial<TranscriptState>, event: TranscriptEvent): TranscriptState {
  const next: TranscriptState = {
    realtimeBySegment: { ...(state.realtimeBySegment ?? {}) },
    finalBySegment: { ...(state.finalBySegment ?? {}) },
  };
  if (event.type === "realtime") {
    next.realtimeBySegment[event.segmentId] = event.displayText ?? event.text ?? "";
  } else {
    delete next.realtimeBySegment[event.segmentId];
    next.finalBySegment[event.segmentId] = event.text;
  }
  return next;
}

export function shouldInsertFinalTranscript(insertedSegments: Set<number>, segmentId: number): boolean {
  if (insertedSegments.has(segmentId)) return false;
  insertedSegments.add(segmentId);
  return true;
}

export function shouldInsertFinalTranscriptText(
  recentText: Map<string, number>,
  text: string,
  nowMs: number,
  options: FinalTranscriptTextDedupeOptions = {},
): boolean {
  if (options.enabled === false) return true;
  const key = normalizeTranscriptText(text);
  if (!key) return false;
  const previousMs = recentText.get(key);
  recentText.set(key, nowMs);
  return previousMs === undefined || nowMs - previousMs > (options.windowMs ?? FINAL_TRANSCRIPT_TEXT_DEDUPE_MS);
}

export function isBlankAudioTranscript(text: string): boolean {
  return normalizeTranscriptText(text).replace(/[\[\](){}]/g, "") === "blank_audio";
}

const smartEditorCommands = new Map<string, string>([
  ["new line", "insert-newline"],
  ["new paragraph", "insert-paragraph"],
  ["undo", "undo"],
  ["redo", "redo"],
  ["select all", "select-all"],
  ["clear all", "clear-all"],
  ["stop recording", "stop-dictation"],
  ["delete last word", "delete-last-word"],
  ["delete last sentence", "delete-last-sentence"],
  ["save document", "save-document"],
  ["bold", "bold"],
  ["italic", "italic"],
  ["underline", "underline"],
  ["clear formatting", "clear-formatting"],
]);

const smartEditorCommandVariants = new Map<string, string>([
  ["newline", "insert-newline"],
  ["new para", "insert-paragraph"],
  ["select everything", "select-all"],
  ["clear everything", "clear-all"],
  ["stop dictation", "stop-dictation"],
  ["pause recording", "stop-dictation"],
  ["scratch that", "scratch-that"],
  ["delete previous word", "delete-last-word"],
  ["undo that", "undo"],
  ["redo that", "redo"],
]);

const templateMarkerCommands = new Map<string, string>([
  ["next field", "next-template-field"],
  ["previous field", "previous-template-field"],
  ["first field", "first-template-field"],
  ["skip field", "skip-template-field"],
  ["cancel field navigation", "cancel-template-field-navigation"],
]);

const spokenPunctuation = [
  { words: ["exclamation", "mark"], symbol: "!" },
  { words: ["exclamation", "point"], symbol: "!" },
  { words: ["question", "mark"], symbol: "?" },
  { words: ["full", "stop"], symbol: "." },
  { words: ["open", "bracket"], symbol: "(" },
  { words: ["close", "bracket"], symbol: ")" },
  { words: ["open", "quote"], symbol: '"' },
  { words: ["close", "quote"], symbol: '"' },
  { words: ["comma"], symbol: "," },
  { words: ["period"], symbol: "." },
  { words: ["colon"], symbol: ":" },
  { words: ["semicolon"], symbol: ";" },
  { words: ["dash"], symbol: "-" },
  { words: ["hyphen"], symbol: "-" },
  { words: ["slash"], symbol: "/" },
];

export function expandMacros(text: string, macros: { trigger: string; replacement: string; enabled: boolean }[]): string {
  const enabledMacros = [...macros].filter((macro) => macro.enabled).sort((left, right) => right.trigger.length - left.trigger.length);
  if (!enabledMacros.length) return text;
  const replacements = new Map(enabledMacros.map((macro) => [macro.trigger.toLowerCase(), macro.replacement]));
  const triggers = enabledMacros.map((macro) => escapeRegExp(macro.trigger)).join("|");
  return text.replace(new RegExp(`(^|[^A-Za-z0-9_])(${triggers})([.,!?;:])?(?=$|[^A-Za-z0-9_])`, "gi"), (
    _match,
    prefix: string,
    trigger: string,
    punctuation: string | undefined,
  ) => {
    const replacement = replacements.get(trigger.toLowerCase());
    if (!replacement) return _match;
    return `${prefix}${mergeReplacementPunctuation(replacement, punctuation)}`;
  });
}

export function routeFinalText(
  text: string,
  target: EditorTarget,
  macros: { trigger: string; replacement: string; enabled: boolean }[],
  options: TranscriptRoutingOptions = {},
): FinalRoute {
  const normalized = normalizeVoiceCommand(text);
  const voiceCommandsEnabled = options.voiceCommandsEnabled ?? true;
  const macrosEnabled = options.macrosEnabled ?? true;
  const voiceCommandVariantsEnabled = options.voiceCommandVariantsEnabled ?? true;
  const templateMarkerCommand = templateMarkerCommands.get(normalized);
  if (target === "smart-editor" && voiceCommandsEnabled && options.templateMarkerNavigationEnabled && templateMarkerCommand) {
    return { kind: "command", command: templateMarkerCommand };
  }
  if (voiceCommandsEnabled && smartEditorCommands.has(normalized)) {
    return { kind: "command", command: smartEditorCommands.get(normalized)! };
  }
  if (voiceCommandsEnabled && voiceCommandVariantsEnabled && smartEditorCommandVariants.has(normalized)) {
    return { kind: "command", command: smartEditorCommandVariants.get(normalized)! };
  }
  const insertText = voiceCommandsEnabled ? convertSpokenPunctuation(text) : text;
  return { kind: "insert", text: macrosEnabled ? expandMacros(insertText, macros) : insertText };
}

function normalizeVoiceCommand(value: string): string {
  return normalizeTranscriptText(value)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTranscriptText(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function convertSpokenPunctuation(text: string): string {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  const converted: string[] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const match = spokenPunctuation.find((candidate) =>
      candidate.words.every((word, offset) => normalizePunctuationToken(tokens[index + offset] ?? "") === word),
    );
    if (match) {
      converted.push(match.symbol);
      index += match.words.length - 1;
    } else {
      converted.push(tokens[index]);
    }
  }
  return applyPunctuationSpacing(converted.join(" "));
}

function normalizePunctuationToken(value: string): string {
  return value.toLowerCase().replace(/^[.,!?;:]+|[.,!?;:]+$/g, "");
}

function applyPunctuationSpacing(value: string): string {
  return value
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([([])\s+/g, "$1")
    .replace(/\s+([)\]])/g, "$1")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mergeReplacementPunctuation(replacement: string, punctuation: string | undefined): string {
  if (!punctuation) return replacement;
  return /[.,!?;:]$/.test(replacement) ? replacement : `${replacement}${punctuation}`;
}

export function resolveSttUrl(): string {
  const mode = import.meta.env.VITE_STT_MODE ?? "proxy";
  if (mode === "direct") {
    return import.meta.env.VITE_STT_WS_URL ?? "ws://127.0.0.1:8020/ws/transcribe";
  }
  return import.meta.env.VITE_STT_PROXY_WS_URL ?? `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/ws/stt-proxy`;
}
