type BrowserAudioContext = typeof AudioContext;

type MicrophoneSupportScope = {
  navigator?: {
    mediaDevices?: {
      getUserMedia?: unknown;
    };
  };
  AudioContext?: unknown;
  webkitAudioContext?: unknown;
  isSecureContext?: boolean;
  location?: {
    hostname?: string;
  };
};

type MicrophoneCaptureOptions = {
  onSamples: (samples: Float32Array, sampleRate: number) => void;
  onWarning: (message: string) => void;
  audioDeviceId?: string;
  chunkMs?: number;
  workletUrl?: string;
};

const DEFAULT_CHUNK_MS = 40;
const DEFAULT_WORKLET_URL = "/corestt-audio-worklet.js";
const LOCALHOST_NAMES = new Set(["localhost", "127.0.0.1", "::1"]);
const MICROPHONE_PERMISSION_MESSAGE =
  "Microphone permission is blocked. Allow microphone access for this site in the browser or system settings, then start dictation again.";

export function createMicrophoneAudioConstraints(audioDeviceId?: string): MediaTrackConstraints {
  return {
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    ...(audioDeviceId ? { deviceId: { exact: audioDeviceId } } : {}),
  };
}

export function shouldRestartMicrophoneForDeviceChange(
  previousAudioDeviceId: string | null | undefined,
  nextAudioDeviceId: string | null | undefined,
  micStatus: string,
): boolean {
  const isActive = micStatus === "capturing" || micStatus === "starting";
  return isActive && (previousAudioDeviceId ?? "") !== (nextAudioDeviceId ?? "");
}

export function isMicrophoneCaptureSupported(scope: MicrophoneSupportScope = globalThis as MicrophoneSupportScope): boolean {
  const hasGetUserMedia = typeof scope.navigator?.mediaDevices?.getUserMedia === "function";
  const hasAudioContext = typeof (scope.AudioContext ?? scope.webkitAudioContext) === "function";
  const hostname = scope.location?.hostname ?? "";
  const secureEnough = scope.isSecureContext === true || LOCALHOST_NAMES.has(hostname);
  return hasGetUserMedia && hasAudioContext && secureEnough;
}

export function getMicrophoneCaptureErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError" || /permission denied/i.test(error.message)) {
      return MICROPHONE_PERMISSION_MESSAGE;
    }
    if (error.name === "NotFoundError") {
      return "No microphone was found. Connect or enable a microphone, then start dictation again.";
    }
    return error.message;
  }
  return "Microphone capture failed";
}

export class MicrophoneCapture {
  private audioContext: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private worklet: AudioWorkletNode | null = null;
  private silenceGain: GainNode | null = null;
  private stream: MediaStream | null = null;
  private sampleRate = 0;

  constructor(private options: MicrophoneCaptureOptions) {}

  get currentSampleRate(): number {
    return this.sampleRate;
  }

  get isCapturing(): boolean {
    return Boolean(this.stream);
  }

  async start(): Promise<number> {
    if (this.stream && this.audioContext) return this.audioContext.sampleRate;
    if (!isMicrophoneCaptureSupported()) {
      throw new Error("Microphone capture requires browser microphone access on localhost or HTTPS.");
    }

    const AudioContextConstructor = getAudioContextConstructor();
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: createMicrophoneAudioConstraints(this.options.audioDeviceId),
      video: false,
    });
    this.audioContext = new AudioContextConstructor();
    this.sampleRate = this.audioContext.sampleRate;

    if (!this.audioContext.audioWorklet) {
      this.stop();
      throw new Error("AudioWorklet is not supported by this browser.");
    }

    await this.audioContext.audioWorklet.addModule(this.options.workletUrl ?? DEFAULT_WORKLET_URL);
    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.worklet = new AudioWorkletNode(this.audioContext, "corestt-audio-worklet", {
      processorOptions: {
        chunkFrames: Math.max(1, Math.round(this.sampleRate * ((this.options.chunkMs ?? DEFAULT_CHUNK_MS) / 1000))),
      },
    });
    this.silenceGain = this.audioContext.createGain();
    this.silenceGain.gain.value = 0;

    this.worklet.port.onmessage = (event: MessageEvent<{ type?: string; samples?: Float32Array }>) => {
      if (event.data.type !== "samples" || !(event.data.samples instanceof Float32Array)) return;
      this.options.onSamples(event.data.samples, this.sampleRate);
    };
    this.worklet.port.onmessageerror = () => {
      this.options.onWarning("Microphone audio could not be encoded for transcription.");
    };

    this.source.connect(this.worklet);
    this.worklet.connect(this.silenceGain);
    this.silenceGain.connect(this.audioContext.destination);

    return this.sampleRate;
  }

  stop(): void {
    this.worklet?.port.close();
    this.source?.disconnect();
    this.worklet?.disconnect();
    this.silenceGain?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    void this.audioContext?.close();
    this.source = null;
    this.worklet = null;
    this.silenceGain = null;
    this.stream = null;
    this.audioContext = null;
    this.sampleRate = 0;
  }
}

function getAudioContextConstructor(): BrowserAudioContext {
  const windowWithWebkit = window as Window & { webkitAudioContext?: BrowserAudioContext };
  const standardAudioContext = typeof AudioContext === "undefined" ? undefined : AudioContext;
  return standardAudioContext ?? windowWithWebkit.webkitAudioContext!;
}
