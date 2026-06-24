import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildAudioPacket,
  applyTranscriptEvent,
  isBlankAudioTranscript,
  routeFinalText,
  shouldInsertFinalTranscript,
  shouldInsertFinalTranscriptText,
} from "./corestt";
import { getMicrophoneCaptureErrorMessage, isMicrophoneCaptureSupported } from "./micCapture";
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
    expect(routeFinalText("New line.", "smart-editor", [])).toEqual({ kind: "command", command: "insert-newline" });
    expect(routeFinalText("new   paragraph,", "smart-editor", [])).toEqual({ kind: "command", command: "insert-paragraph" });
    expect(routeFinalText("SELECT ALL:", "smart-editor", [])).toEqual({ kind: "command", command: "select-all" });
    expect(routeFinalText("clear all!", "smart-editor", [])).toEqual({ kind: "command", command: "clear-all" });
    expect(routeFinalText("stop recording", "smart-editor", [])).toEqual({ kind: "command", command: "stop-dictation" });
  });

  it("routes common STT variants of smart editor commands", () => {
    expect(routeFinalText("newline", "smart-editor", [])).toEqual({ kind: "command", command: "insert-newline" });
    expect(routeFinalText("new-line", "smart-editor", [])).toEqual({ kind: "command", command: "insert-newline" });
    expect(routeFinalText("new para", "smart-editor", [])).toEqual({ kind: "command", command: "insert-paragraph" });
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

  it("can disable flexible smart editor command variants", () => {
    expect(routeFinalText("new line", "smart-editor", [], { voiceCommandVariantsEnabled: false })).toEqual({
      kind: "command",
      command: "insert-newline",
    });
    expect(routeFinalText("newline", "smart-editor", [], { voiceCommandVariantsEnabled: false })).toEqual({
      kind: "insert",
      text: "newline",
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

  it("routes spoken formatting commands to the smart editor", () => {
    expect(routeFinalText("bold", "smart-editor", [])).toEqual({ kind: "command", command: "bold" });
    expect(routeFinalText("italic.", "smart-editor", [])).toEqual({ kind: "command", command: "italic" });
    expect(routeFinalText("underline", "smart-editor", [])).toEqual({ kind: "command", command: "underline" });
    expect(routeFinalText("clear formatting", "smart-editor", [])).toEqual({ kind: "command", command: "clear-formatting" });
  });

  it("converts standalone spoken punctuation to insertable punctuation", () => {
    expect(routeFinalText("comma", "smart-editor", [])).toEqual({ kind: "insert", text: "," });
    expect(routeFinalText("full stop", "smart-editor", [])).toEqual({ kind: "insert", text: "." });
    expect(routeFinalText("question mark", "smart-editor", [])).toEqual({ kind: "insert", text: "?" });
  });

  it("converts inline spoken punctuation before insertion", () => {
    const result = routeFinalText("hello comma world full stop", "smart-editor", []);

    expect(result).toEqual({ kind: "insert", text: "hello, world." });
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
});

describe("microphone capture support", () => {
  it("reports unsupported browsers without throwing", () => {
    expect(isMicrophoneCaptureSupported({})).toBe(false);
  });

  it("maps browser permission denial to an actionable message", () => {
    const error = Object.assign(new Error("Permission denied"), { name: "NotAllowedError" });

    expect(getMicrophoneCaptureErrorMessage(error)).toBe(
      "Microphone permission is blocked. Allow microphone access for this site in the browser or system settings, then start dictation again.",
    );
  });
});
