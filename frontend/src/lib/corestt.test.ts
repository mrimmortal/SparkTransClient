import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyDictationCaseMode,
  buildAudioPacket,
  applyTranscriptEvent,
  isBlankAudioTranscript,
  routeFinalText,
  shouldCheckFinalTranscriptTextDedupe,
  shouldInsertFinalTranscript,
  shouldInsertFinalTranscriptText,
} from "./corestt";
import {
  createMicrophoneAudioConstraints,
  getMicrophoneCaptureErrorMessage,
  isMicrophoneCaptureSupported,
  shouldRestartMicrophoneForDeviceChange,
} from "./micCapture";
import { sampleUser } from "./sampleUser";
import { SttClient } from "./sttClient";

class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 3;
  static instances: FakeWebSocket[] = [];

  binaryType = "";
  readyState = FakeWebSocket.CONNECTING;
  sent: (string | ArrayBuffer)[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string | ArrayBuffer }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(public url: string) {
    FakeWebSocket.instances.push(this);
  }

  send(data: string | ArrayBuffer) {
    this.sent.push(data);
  }

  close() {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.();
  }

  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  receive(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  closeFromServer() {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.();
  }
}

function makeClient() {
  const states: string[] = [];
  const warnings: string[] = [];
  const messages: unknown[] = [];
  const retryAttempts: number[] = [];
  const client = new SttClient("ws://corestt.test/ws/transcribe", {
    onState: (state) => states.push(state),
    onMessage: (message) => messages.push(message),
    onWarning: (message) => warnings.push(message),
    onRetry: (attempt) => retryAttempts.push(attempt),
  });
  return { client, states, warnings, messages, retryAttempts };
}

beforeEach(() => {
  vi.useFakeTimers();
  FakeWebSocket.instances = [];
  vi.stubGlobal("WebSocket", FakeWebSocket);
  vi.stubGlobal("window", {
    setInterval,
    clearInterval,
    setTimeout,
    clearTimeout,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("buildAudioPacket", () => {
  it("prefixes metadata length as little-endian uint32", () => {
    const audio = new Int16Array([1, 2]).buffer;

    const packet = buildAudioPacket(
      {
        sampleRate: 16000,
        channels: 1,
        format: "pcm_s16le",
        frames: 2,
        clientPlatform: "web",
        clientProtocolVersion: "1.0",
        sequence: 1,
      },
      audio,
    );

    const view = new DataView(packet);
    const metadataLength = view.getUint32(0, true);

    expect(metadataLength).toBe(packet.byteLength - 4 - audio.byteLength);
  });

  it("rejects packet metadata with mismatched frames", () => {
    expect(() =>
      buildAudioPacket(
        {
          sampleRate: 16000,
          channels: 1,
          format: "pcm_s16le",
          frames: 3,
        },
        new Int16Array([1, 2]).buffer,
      ),
    ).toThrow(/frames/i);
  });
});

describe("transcript routing", () => {
  it("updates realtime text by segment id without appending duplicates", () => {
    const first = applyTranscriptEvent({}, { type: "realtime", segmentId: 1, text: "draft" });
    const second = applyTranscriptEvent(first, { type: "realtime", segmentId: 1, text: "final draft" });

    expect(Object.values(second.realtimeBySegment)).toEqual(["final draft"]);
  });

  it("routes each final transcript segment only once", () => {
    const routedSegments = new Set<number>();

    expect(shouldInsertFinalTranscript(routedSegments, 1)).toBe(true);
    expect(shouldInsertFinalTranscript(routedSegments, 1)).toBe(false);
    expect(shouldInsertFinalTranscript(routedSegments, 2)).toBe(true);
  });

  it("deduplicates repeated final transcript text inside a short window", () => {
    const recentFinalText = new Map<string, number>();

    expect(shouldInsertFinalTranscriptText(recentFinalText, "Start concentration.", 1000)).toBe(true);
    expect(shouldInsertFinalTranscriptText(recentFinalText, "start concentration", 2000)).toBe(false);
    expect(shouldInsertFinalTranscriptText(recentFinalText, "Different text", 2500)).toBe(true);
    expect(shouldInsertFinalTranscriptText(recentFinalText, "Start concentration.", 8000)).toBe(true);
  });

  it("skips duplicate text filtering for voice command phrases", () => {
    expect(shouldCheckFinalTranscriptTextDedupe("undo", "smart-editor")).toBe(false);
    expect(shouldCheckFinalTranscriptTextDedupe("undo that", "smart-editor")).toBe(false);
    expect(shouldCheckFinalTranscriptTextDedupe("redo", "smart-editor")).toBe(false);
    expect(shouldCheckFinalTranscriptTextDedupe("next line", "smart-editor")).toBe(false);
    expect(shouldCheckFinalTranscriptTextDedupe("normal dictated text", "smart-editor")).toBe(true);
  });

  it("honors final transcript text dedupe settings", () => {
    const disabled = new Map<string, number>();
    expect(shouldInsertFinalTranscriptText(disabled, "Repeat me.", 1000, { enabled: false })).toBe(true);
    expect(shouldInsertFinalTranscriptText(disabled, "repeat me", 1100, { enabled: false })).toBe(true);

    const customWindow = new Map<string, number>();
    expect(shouldInsertFinalTranscriptText(customWindow, "Repeat me.", 1000, { windowMs: 250 })).toBe(true);
    expect(shouldInsertFinalTranscriptText(customWindow, "repeat me", 1100, { windowMs: 250 })).toBe(false);
    expect(shouldInsertFinalTranscriptText(customWindow, "repeat me", 1300, { windowMs: 250 })).toBe(false);
    expect(shouldInsertFinalTranscriptText(customWindow, "repeat me", 1600, { windowMs: 250 })).toBe(true);
  });

  it("detects blank audio transcript markers", () => {
    expect(isBlankAudioTranscript("[BLANK_AUDIO]")).toBe(true);
    expect(isBlankAudioTranscript("blank_audio.")).toBe(true);
    expect(isBlankAudioTranscript("Blank audio")).toBe(false);
    expect(isBlankAudioTranscript("actual words")).toBe(false);
  });

  it("runs smart editor commands before applying the transcript insertion target", () => {
    const smart = routeFinalText("new paragraph", "smart-editor", []);
    const micro = routeFinalText("new paragraph", "micro-editor", []);

    expect(smart.kind).toBe("command");
    expect(micro).toEqual({ kind: "command", command: "insert-paragraph" });
  });

  it("routes smart editor commands case-insensitively and ignores dictated punctuation", () => {
    expect(routeFinalText("Next line.", "smart-editor", [])).toEqual({ kind: "command", command: "insert-newline" });
    expect(routeFinalText("new   paragraph,", "smart-editor", [])).toEqual({ kind: "command", command: "insert-paragraph" });
    expect(routeFinalText("SELECT ALL:", "smart-editor", [])).toEqual({ kind: "command", command: "select-all" });
    expect(routeFinalText("clear all!", "smart-editor", [])).toEqual({ kind: "command", command: "clear-all" });
    expect(routeFinalText("stop recording", "smart-editor", [])).toEqual({ kind: "command", command: "stop-dictation" });
  });

  it("routes common STT variants of smart editor commands", () => {
    expect(routeFinalText("new line", "smart-editor", [])).toEqual({ kind: "command", command: "insert-newline" });
    expect(routeFinalText("newline", "smart-editor", [])).toEqual({ kind: "command", command: "insert-newline" });
    expect(routeFinalText("new-line", "smart-editor", [])).toEqual({ kind: "command", command: "insert-newline" });
    expect(routeFinalText("line break", "smart-editor", [])).toEqual({ kind: "command", command: "insert-newline" });
    expect(routeFinalText("new para", "smart-editor", [])).toEqual({ kind: "command", command: "insert-paragraph" });
    expect(routeFinalText("next paragraph", "smart-editor", [])).toEqual({ kind: "command", command: "insert-paragraph" });
    expect(routeFinalText("select everything", "smart-editor", [])).toEqual({ kind: "command", command: "select-all" });
    expect(routeFinalText("clear everything", "smart-editor", [])).toEqual({ kind: "command", command: "clear-all" });
    expect(routeFinalText("stop dictation", "smart-editor", [])).toEqual({ kind: "command", command: "stop-dictation" });
    expect(routeFinalText("pause recording", "smart-editor", [])).toEqual({ kind: "command", command: "stop-dictation" });
    expect(routeFinalText("scratch that", "smart-editor", [])).toEqual({ kind: "command", command: "scratch-that" });
    expect(routeFinalText("delete previous word", "smart-editor", [])).toEqual({ kind: "command", command: "delete-last-word" });
    expect(routeFinalText("undo that", "smart-editor", [])).toEqual({ kind: "command", command: "undo" });
    expect(routeFinalText("redo that", "smart-editor", [])).toEqual({ kind: "command", command: "redo" });
  });

  it("routes high-value editing commands case-insensitively", () => {
    expect(routeFinalText("Delete last word.", "smart-editor", [])).toEqual({ kind: "command", command: "delete-last-word" });
    expect(routeFinalText("delete last sentence", "smart-editor", [])).toEqual({ kind: "command", command: "delete-last-sentence" });
    expect(routeFinalText("SAVE DOCUMENT", "smart-editor", [])).toEqual({ kind: "command", command: "save-document" });
  });

  it("routes exact line and document cursor navigation commands", () => {
    expect(routeFinalText("go to line start", "smart-editor", [])).toEqual({ kind: "command", command: "go-line-start" });
    expect(routeFinalText("go to line end", "smart-editor", [])).toEqual({ kind: "command", command: "go-line-end" });
    expect(routeFinalText("go to document start", "smart-editor", [])).toEqual({ kind: "command", command: "go-document-start" });
    expect(routeFinalText("go to start of the document", "smart-editor", [])).toEqual({ kind: "command", command: "go-document-start" });
    expect(routeFinalText("go to start of document", "smart-editor", [])).toEqual({ kind: "command", command: "go-document-start" });
    expect(routeFinalText("go to document end", "smart-editor", [])).toEqual({ kind: "command", command: "go-document-end" });
    expect(routeFinalText("go to end of the document", "smart-editor", [])).toEqual({ kind: "command", command: "go-document-end" });
    expect(routeFinalText("go to end of document", "smart-editor", [])).toEqual({ kind: "command", command: "go-document-end" });
  });

  it("extracts text payloads for insert before and insert after commands", () => {
    expect(routeFinalText("insert before alpha", "smart-editor", [])).toEqual({
      kind: "command",
      command: "insert-before-text",
      args: { text: "alpha" },
    });
    expect(routeFinalText("insert after beta", "smart-editor", [])).toEqual({
      kind: "command",
      command: "insert-after-text",
      args: { text: "beta" },
    });
  });

  it("routes exact selection commands for paragraphs, sentences, and characters", () => {
    expect(routeFinalText("select para", "smart-editor", [])).toEqual({
      kind: "command",
      command: "select-current-paragraph",
    });
    expect(routeFinalText("select next paragraph", "smart-editor", [])).toEqual({
      kind: "command",
      command: "select-adjacent-paragraph",
      args: { direction: "next" },
    });
    expect(routeFinalText("select sentence", "smart-editor", [])).toEqual({
      kind: "command",
      command: "select-current-sentence",
    });
    expect(routeFinalText("select last sentence", "smart-editor", [])).toEqual({
      kind: "command",
      command: "select-adjacent-sentence",
      args: { direction: "last", count: 1 },
    });
    expect(routeFinalText("select character", "smart-editor", [])).toEqual({
      kind: "command",
      command: "select-current-character",
    });
    expect(routeFinalText("select next character", "smart-editor", [])).toEqual({
      kind: "command",
      command: "select-adjacent-character",
      args: { direction: "next", count: 1 },
    });
  });

  it("extracts count payloads for sentence and character selection commands", () => {
    expect(routeFinalText("select next 3 sentences", "smart-editor", [])).toEqual({
      kind: "command",
      command: "select-adjacent-sentence",
      args: { direction: "next", count: 3 },
    });
    expect(routeFinalText("select last three characters", "smart-editor", [])).toEqual({
      kind: "command",
      command: "select-adjacent-character",
      args: { direction: "last", count: 3 },
    });
  });

  it("keeps selection commands out of mixed boundary routing", () => {
    expect(routeFinalText("hello select next sentence", "smart-editor", [])).toEqual({
      kind: "insert",
      text: "hello select next sentence",
    });
    expect(routeFinalText("select next sentence hello", "smart-editor", [])).toEqual({
      kind: "insert",
      text: "select next sentence hello",
    });
  });

  it("routes next field only when template marker navigation is enabled", () => {
    expect(routeFinalText("next field", "smart-editor", [])).toEqual({ kind: "insert", text: "next field" });
    expect(routeFinalText("next field", "micro-editor", [], { templateMarkerNavigationEnabled: true })).toEqual({
      kind: "insert",
      text: "next field",
    });
    expect(routeFinalText("next field.", "smart-editor", [], { templateMarkerNavigationEnabled: true })).toEqual({
      kind: "command",
      command: "next-template-field",
    });
  });

  it("routes full template field navigation commands only when marker navigation is enabled", () => {
    expect(routeFinalText("previous field", "smart-editor", [], { templateMarkerNavigationEnabled: true })).toEqual({
      kind: "command",
      command: "previous-template-field",
    });
    expect(routeFinalText("first field", "smart-editor", [], { templateMarkerNavigationEnabled: true })).toEqual({
      kind: "command",
      command: "first-template-field",
    });
    expect(routeFinalText("skip field", "smart-editor", [], { templateMarkerNavigationEnabled: true })).toEqual({
      kind: "command",
      command: "skip-template-field",
    });
    expect(routeFinalText("cancel field navigation", "smart-editor", [], { templateMarkerNavigationEnabled: true })).toEqual({
      kind: "command",
      command: "cancel-template-field-navigation",
    });
    expect(routeFinalText("previous field", "smart-editor", [])).toEqual({ kind: "insert", text: "previous field" });
  });

  it("can disable flexible smart editor command variants", () => {
    expect(routeFinalText("new line", "smart-editor", [], { voiceCommandVariantsEnabled: false })).toEqual({
      kind: "insert",
      text: "new line",
    });
    expect(routeFinalText("newline", "smart-editor", [], { voiceCommandVariantsEnabled: false })).toEqual({
      kind: "insert",
      text: "newline",
    });
    expect(routeFinalText("bold", "smart-editor", [], { voiceCommandVariantsEnabled: false })).toEqual({
      kind: "insert",
      text: "bold",
    });
  });

  it("inserts command phrases as text when voice commands are disabled", () => {
    const result = routeFinalText("new paragraph", "smart-editor", [], { voiceCommandsEnabled: false });

    expect(result).toEqual({ kind: "insert", text: "new paragraph" });
  });

  it("inserts recording command phrases as text when voice commands are disabled", () => {
    const result = routeFinalText("stop recording", "smart-editor", [], { voiceCommandsEnabled: false });

    expect(result).toEqual({ kind: "insert", text: "stop recording" });
  });

  it("routes explicit formatting, case, and TipTap control commands to the smart editor", () => {
    expect(routeFinalText("start bold", "smart-editor", [])).toEqual({ kind: "command", command: "start-bold" });
    expect(routeFinalText("stop bold", "smart-editor", [])).toEqual({ kind: "command", command: "stop-bold" });
    expect(routeFinalText("start italic.", "smart-editor", [])).toEqual({ kind: "command", command: "start-italic" });
    expect(routeFinalText("stop italic", "smart-editor", [])).toEqual({ kind: "command", command: "stop-italic" });
    expect(routeFinalText("start underline", "smart-editor", [])).toEqual({ kind: "command", command: "start-underline" });
    expect(routeFinalText("stop underline", "smart-editor", [])).toEqual({ kind: "command", command: "stop-underline" });
    expect(routeFinalText("start upper case", "smart-editor", [])).toEqual({ kind: "command", command: "start-upper-case" });
    expect(routeFinalText("stop upper case", "smart-editor", [])).toEqual({ kind: "command", command: "stop-upper-case" });
    expect(routeFinalText("start lower case", "smart-editor", [])).toEqual({ kind: "command", command: "start-lower-case" });
    expect(routeFinalText("stop lower case", "smart-editor", [])).toEqual({ kind: "command", command: "stop-lower-case" });
    expect(routeFinalText("start bullet list", "smart-editor", [])).toEqual({ kind: "command", command: "start-bullet-list" });
    expect(routeFinalText("stop bullet list", "smart-editor", [])).toEqual({ kind: "command", command: "stop-bullet-list" });
    expect(routeFinalText("start numbered list", "smart-editor", [])).toEqual({ kind: "command", command: "start-numbered-list" });
    expect(routeFinalText("stop numbered list", "smart-editor", [])).toEqual({ kind: "command", command: "stop-numbered-list" });
    expect(routeFinalText("start heading", "smart-editor", [])).toEqual({ kind: "command", command: "start-heading" });
    expect(routeFinalText("stop heading", "smart-editor", [])).toEqual({ kind: "command", command: "stop-heading" });
    expect(routeFinalText("start paragraph", "smart-editor", [])).toEqual({ kind: "command", command: "start-paragraph" });
    expect(routeFinalText("normal text", "smart-editor", [])).toEqual({ kind: "command", command: "start-paragraph" });
    expect(routeFinalText("start quote", "smart-editor", [])).toEqual({ kind: "command", command: "start-quote" });
    expect(routeFinalText("stop quote", "smart-editor", [])).toEqual({ kind: "command", command: "stop-quote" });
    expect(routeFinalText("start code block", "smart-editor", [])).toEqual({ kind: "command", command: "start-code-block" });
    expect(routeFinalText("stop code block", "smart-editor", [])).toEqual({ kind: "command", command: "stop-code-block" });
    expect(routeFinalText("insert horizontal rule", "smart-editor", [])).toEqual({ kind: "command", command: "insert-horizontal-rule" });
    expect(routeFinalText("clear formatting", "smart-editor", [])).toEqual({ kind: "command", command: "clear-formatting" });
  });

  it("routes common formatting and TipTap variants only when variants are enabled", () => {
    expect(routeFinalText("bold on", "smart-editor", [])).toEqual({ kind: "command", command: "start-bold" });
    expect(routeFinalText("turn off italic", "smart-editor", [])).toEqual({ kind: "command", command: "stop-italic" });
    expect(routeFinalText("all caps on", "smart-editor", [])).toEqual({ kind: "command", command: "start-upper-case" });
    expect(routeFinalText("lowercase off", "smart-editor", [])).toEqual({ kind: "command", command: "stop-lower-case" });
    expect(routeFinalText("start bullets", "smart-editor", [])).toEqual({ kind: "command", command: "start-bullet-list" });
    expect(routeFinalText("end numbered list", "smart-editor", [])).toEqual({ kind: "command", command: "stop-numbered-list" });
    expect(routeFinalText("plain text", "smart-editor", [])).toEqual({ kind: "command", command: "start-paragraph" });
    expect(routeFinalText("horizontal line", "smart-editor", [])).toEqual({ kind: "command", command: "insert-horizontal-rule" });
    expect(routeFinalText("bold on", "smart-editor", [], { voiceCommandVariantsEnabled: false })).toEqual({
      kind: "insert",
      text: "bold on",
    });
  });

  it("routes safe formatting commands at transcript boundaries with insert text", () => {
    expect(routeFinalText("start bold hello", "smart-editor", [])).toEqual({
      kind: "mixed",
      beforeCommands: ["start-bold"],
      text: "hello",
      afterCommands: [],
    });
    expect(routeFinalText("hello stop bold", "smart-editor", [])).toEqual({
      kind: "mixed",
      beforeCommands: [],
      text: "hello",
      afterCommands: ["stop-bold"],
    });
    expect(routeFinalText("start bold hello stop bold", "smart-editor", [])).toEqual({
      kind: "mixed",
      beforeCommands: ["start-bold"],
      text: "hello",
      afterCommands: ["stop-bold"],
    });
    expect(routeFinalText("hello next line", "smart-editor", [])).toEqual({
      kind: "mixed",
      beforeCommands: [],
      text: "hello",
      afterCommands: ["insert-newline"],
    });
    expect(routeFinalText("start bullet hello", "smart-editor", [])).toEqual({
      kind: "mixed",
      beforeCommands: ["start-bullet-list"],
      text: "hello",
      afterCommands: [],
    });
    expect(routeFinalText("hello start bullet", "smart-editor", [])).toEqual({
      kind: "mixed",
      beforeCommands: [],
      text: "hello",
      afterCommands: ["start-bullet-list"],
    });
  });

  it("does not boundary-route command phrases in the middle or unsafe commands around text", () => {
    expect(routeFinalText("please start bold hello", "smart-editor", [])).toEqual({
      kind: "insert",
      text: "please start bold hello",
    });
    expect(routeFinalText("clear all hello", "smart-editor", [])).toEqual({
      kind: "insert",
      text: "clear all hello",
    });
    expect(routeFinalText("hello undo", "smart-editor", [])).toEqual({
      kind: "insert",
      text: "hello undo",
    });
  });

  it("converts standalone spoken punctuation to insertable punctuation", () => {
    expect(routeFinalText("comma", "smart-editor", [])).toEqual({ kind: "insert", text: "," });
    expect(routeFinalText("full stop", "smart-editor", [])).toEqual({ kind: "insert", text: "." });
    expect(routeFinalText("question mark", "smart-editor", [])).toEqual({ kind: "insert", text: "?" });
  });

  it("removes automatic trailing full stops from normal transcript text", () => {
    expect(routeFinalText("hello world.", "smart-editor", [])).toEqual({ kind: "insert", text: "hello world" });
    expect(routeFinalText("hello world", "smart-editor", [])).toEqual({ kind: "insert", text: "hello world" });
  });

  it("converts inline spoken punctuation before insertion", () => {
    const result = routeFinalText("hello comma world full stop", "smart-editor", []);

    expect(result).toEqual({ kind: "insert", text: "hello, world." });
  });

  it("applies dictation case modes to routed insert text", () => {
    expect(applyDictationCaseMode("Mixed Case", "normal")).toBe("Mixed Case");
    expect(applyDictationCaseMode("Mixed Case", "upper")).toBe("MIXED CASE");
    expect(applyDictationCaseMode("Mixed Case", "lower")).toBe("mixed case");
  });

  it("does not convert spoken punctuation when voice commands are disabled", () => {
    const result = routeFinalText("hello comma world full stop", "smart-editor", [], { voiceCommandsEnabled: false });

    expect(result).toEqual({ kind: "insert", text: "hello comma world full stop" });
  });

  it("skips macro expansion when macros are disabled", () => {
    const result = routeFinalText(
      "standard closing note",
      "smart-editor",
      [{ trigger: "standard closing note", replacement: "Please review.", enabled: true }],
      { macrosEnabled: false },
    );

    expect(result).toEqual({ kind: "insert", text: "standard closing note" });
  });

  it("converts spoken punctuation before macro expansion", () => {
    const result = routeFinalText(
      "standard closing note comma thanks",
      "smart-editor",
      [{ trigger: "standard closing note", replacement: "Please review.", enabled: true }],
    );

    expect(result).toEqual({ kind: "insert", text: "Please review. thanks" });
  });

  it("expands multi-word macros next to punctuation without duplicating terminal punctuation", () => {
    const result = routeFinalText(
      "standard closing note.",
      "smart-editor",
      [{ trigger: "standard closing note", replacement: "Please review.", enabled: true }],
    );

    expect(result).toEqual({ kind: "insert", text: "Please review." });
  });

  it("expands macros next to comma punctuation without leaving doubled punctuation", () => {
    const result = routeFinalText(
      "standard closing note, thanks",
      "smart-editor",
      [{ trigger: "standard closing note", replacement: "Please review.", enabled: true }],
    );

    expect(result).toEqual({ kind: "insert", text: "Please review. thanks" });
  });

  it("expands macro triggers that contain regex or punctuation characters", () => {
    const result = routeFinalText("prefer c++ today", "smart-editor", [{ trigger: "c++", replacement: "C plus plus", enabled: true }]);

    expect(result).toEqual({ kind: "insert", text: "prefer C plus plus today" });
  });

  it("expands macro triggers that contain apostrophes", () => {
    const result = routeFinalText("please add doctor's note today", "smart-editor", [
      { trigger: "doctor's note", replacement: "clinician note", enabled: true },
    ]);

    expect(result).toEqual({ kind: "insert", text: "please add clinician note today" });
  });

  it("does not expand macro triggers inside longer words", () => {
    const result = routeFinalText("prestandard closing note", "smart-editor", [
      { trigger: "standard closing note", replacement: "Please review.", enabled: true },
    ]);

    expect(result).toEqual({ kind: "insert", text: "prestandard closing note" });
  });

  it("prefers longer overlapping macro triggers before shorter triggers", () => {
    const result = routeFinalText("standard closing note", "smart-editor", [
      { trigger: "note", replacement: "memorandum", enabled: true },
      { trigger: "standard closing note", replacement: "Please review.", enabled: true },
    ]);

    expect(result).toEqual({ kind: "insert", text: "Please review." });
  });

  it("does not expand macro triggers inside another macro replacement", () => {
    const result = routeFinalText("standard closing note", "smart-editor", [
      { trigger: "standard closing note", replacement: "Please review note.", enabled: true },
      { trigger: "note", replacement: "memorandum", enabled: true },
    ]);

    expect(result).toEqual({ kind: "insert", text: "Please review note." });
  });
});

describe("sample user defaults", () => {
  it("matches the seeded sample account", () => {
    expect(sampleUser.email).toBe("sample@sparktrans.app");
    expect(sampleUser.password).toBe("SampleUser123!");
  });
});

describe("SttClient streaming lifecycle", () => {
  it("queues start until CoreSTT sends ready", () => {
    const { client, states } = makeClient();

    client.start();
    const socket = FakeWebSocket.instances[0];
    socket.open();

    expect(socket.sent).toEqual([]);

    socket.receive({ type: "ready" });

    expect(socket.sent[0]).toBe(JSON.stringify({ type: "start" }));
    expect(states).toContain("STREAMING");
  });

  it("sends selected domain when queued start runs after ready", () => {
    const { client } = makeClient();

    client.start({ domain: "medical" });
    const socket = FakeWebSocket.instances[0];
    socket.open();
    socket.receive({ type: "ready" });

    expect(socket.sent[0]).toBe(JSON.stringify({ type: "start", domain: "medical" }));
  });

  it("sends audio packets only while streaming", () => {
    const { client } = makeClient();

    client.connect();
    const socket = FakeWebSocket.instances[0];
    socket.open();

    expect(client.sendFloatSamples(new Float32Array([0, 0.5]), 16000)).toBe(false);

    socket.receive({ type: "ready" });
    client.start();

    expect(client.sendFloatSamples(new Float32Array([0, 0.5]), 16000)).toBe(true);
    expect(socket.sent.some((item) => item instanceof ArrayBuffer)).toBe(true);
  });

  it("reconnects with bounded backoff while streaming is still requested", () => {
    const { client, retryAttempts } = makeClient();

    client.start();
    const firstSocket = FakeWebSocket.instances[0];
    firstSocket.open();
    firstSocket.receive({ type: "ready" });
    firstSocket.closeFromServer();

    expect(retryAttempts).toEqual([1]);

    vi.advanceTimersByTime(1000);
    const secondSocket = FakeWebSocket.instances[1];
    secondSocket.open();
    secondSocket.receive({ type: "ready" });

    expect(secondSocket.sent[0]).toBe(JSON.stringify({ type: "start" }));
  });

  it("does not reconnect after a non-retryable packet error", () => {
    const { client, warnings, retryAttempts } = makeClient();

    client.start();
    const socket = FakeWebSocket.instances[0];
    socket.open();
    socket.receive({ type: "ready" });
    socket.receive({ type: "error", where: "audio_packet", message: "bad packet" });
    socket.closeFromServer();

    vi.runOnlyPendingTimers();

    expect(warnings).toEqual(["bad packet"]);
    expect(retryAttempts).toEqual([]);
  });

  it("does not reconnect after a non-retryable domain error", () => {
    const { client, warnings, retryAttempts } = makeClient();

    client.start({ domain: "missing" });
    const socket = FakeWebSocket.instances[0];
    socket.open();
    socket.receive({ type: "ready" });
    socket.receive({ type: "error", where: "domain", message: "Unknown domain profile: missing" });
    socket.closeFromServer();

    vi.runOnlyPendingTimers();

    expect(warnings).toEqual(["Unknown domain profile: missing"]);
    expect(retryAttempts).toEqual([]);
  });
});

describe("microphone capture support", () => {
  it("reports unsupported browsers without throwing", () => {
    expect(isMicrophoneCaptureSupported({})).toBe(false);
  });

  it("omits device constraints for the browser default microphone", () => {
    expect(createMicrophoneAudioConstraints()).toEqual({
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    });
  });

  it("requests the selected microphone device exactly", () => {
    expect(createMicrophoneAudioConstraints("usb-mic-1")).toEqual({
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      deviceId: { exact: "usb-mic-1" },
    });
  });

  it("restarts active microphone capture after the saved device changes", () => {
    expect(shouldRestartMicrophoneForDeviceChange("built-in", "usb-mic", "capturing")).toBe(true);
    expect(shouldRestartMicrophoneForDeviceChange("built-in", "usb-mic", "starting")).toBe(true);
    expect(shouldRestartMicrophoneForDeviceChange("built-in", "usb-mic", "stopped")).toBe(false);
    expect(shouldRestartMicrophoneForDeviceChange("usb-mic", "usb-mic", "capturing")).toBe(false);
  });

  it("maps browser permission denial to an actionable message", () => {
    const error = Object.assign(new Error("Permission denied"), { name: "NotAllowedError" });

    expect(getMicrophoneCaptureErrorMessage(error)).toBe(
      "Microphone permission is blocked. Allow microphone access for this site in the browser or system settings, then start dictation again.",
    );
  });
});
