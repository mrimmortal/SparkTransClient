import { buildAudioPacket, ConnectionState, floatToPcm16 } from "./corestt";

type SttClientOptions = {
  onState: (state: ConnectionState) => void;
  onMessage: (message: unknown) => void;
  onWarning: (message: string) => void;
  onRetry?: (attempt: number, delayMs: number) => void;
};

type SttStartOptions = {
  domain?: string | null;
};

export class SttClient {
  private socket: WebSocket | null = null;
  private sequence = 0;
  private state: ConnectionState = "DISCONNECTED";
  private pingTimer: number | undefined;
  private reconnectTimer: number | undefined;
  private reconnectAttempt = 0;
  private streamRequested = false;
  private startOptions: SttStartOptions = {};
  private manualClose = false;

  constructor(private url: string, private options: SttClientOptions) {}

  connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) return;
    this.clearReconnect();
    this.manualClose = false;
    this.setState("CONNECTING");
    const socket = new WebSocket(this.url);
    this.socket = socket;
    socket.binaryType = "arraybuffer";
    socket.onopen = () => this.setState("CONNECTED");
    socket.onmessage = (event) => this.handleMessage(event.data);
    socket.onerror = () => {
      this.stopPing();
      this.setState("ERROR");
    };
    socket.onclose = () => {
      this.stopPing();
      if (this.socket !== socket) return;
      this.socket = null;
      if (this.manualClose) {
        this.manualClose = false;
        return;
      }
      this.setState("CLOSED");
      if (this.streamRequested) this.scheduleReconnect();
    };
  }

  start(options: SttStartOptions = {}) {
    this.streamRequested = true;
    this.startOptions = options;
    if (!this.socket) {
      this.connect();
      return;
    }
    if (this.state === "READY") this.sendStart();
  }

  stop() {
    this.streamRequested = false;
    this.clearReconnect();
    this.stopPing();
    if (!this.socket || this.state !== "STREAMING") return;
    this.setState("STOPPING");
    this.socket.send(JSON.stringify({ type: "stop" }));
    this.setState("READY");
  }

  clear() {
    this.socket?.send(JSON.stringify({ type: "clear" }));
  }

  sendFloatSamples(samples: Float32Array, sampleRate: number, channels = 1): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || this.state !== "STREAMING") return false;
    const pcm = floatToPcm16(samples);
    const packet = buildAudioPacket(
      {
        sampleRate,
        channels,
        format: "pcm_s16le",
        frames: pcm.length / channels,
        sentAt: performance.now(),
        clientPlatform: import.meta.env.VITE_STT_CLIENT_PLATFORM ?? "web",
        clientProtocolVersion: import.meta.env.VITE_STT_PROTOCOL_VERSION ?? "1.0",
        sequence: this.sequence++,
      },
      pcm.buffer,
    );
    this.socket.send(packet);
    return true;
  }

  disconnect() {
    this.streamRequested = false;
    this.manualClose = true;
    this.clearReconnect();
    this.stopPing();
    this.socket?.close();
    this.socket = null;
    this.setState("DISCONNECTED");
  }

  private handleMessage(data: string | ArrayBuffer) {
    if (typeof data !== "string") return;
    let message: { type?: string; message?: string; where?: string };
    try {
      message = JSON.parse(data) as { type?: string; message?: string; where?: string };
    } catch {
      this.options.onWarning("Transcription service sent invalid JSON");
      return;
    }
    if (message.type === "ready") {
      this.reconnectAttempt = 0;
      this.setState("READY");
      if (this.streamRequested) this.sendStart();
    }
    if (message.type === "warning") this.options.onWarning(message.message ?? "Warning from transcription service");
    if (message.type === "error") {
      this.options.onWarning(message.message ?? "Transcription error");
      if (message.where === "audio_packet" || message.where === "command" || message.where === "domain") {
        this.streamRequested = false;
        this.clearReconnect();
        this.stopPing();
      }
      this.setState("ERROR");
    }
    this.options.onMessage(message);
  }

  private sendStart() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    const domain = this.startOptions.domain?.trim();
    this.socket.send(JSON.stringify(domain ? { type: "start", domain } : { type: "start" }));
    this.setState("STREAMING");
    this.startPing();
  }

  private startPing() {
    this.stopPing();
    const intervalMs = Number(import.meta.env.VITE_STT_PING_INTERVAL_MS ?? 2500);
    this.pingTimer = window.setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: "ping" }));
      }
    }, intervalMs);
  }

  private stopPing() {
    window.clearInterval(this.pingTimer);
    this.pingTimer = undefined;
  }

  private scheduleReconnect() {
    this.clearReconnect();
    this.reconnectAttempt += 1;
    const delayMs = Math.min(1000 * 2 ** (this.reconnectAttempt - 1), 30000);
    this.options.onRetry?.(this.reconnectAttempt, delayMs);
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = undefined;
      if (this.streamRequested) this.connect();
    }, delayMs);
  }

  private clearReconnect() {
    window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
  }

  private setState(state: ConnectionState) {
    this.state = state;
    this.options.onState(state);
  }
}
