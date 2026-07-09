# CoreSTT WebSocket Client Contract

Use this before changing CoreSTT packet/message handling in this repo. This
document summarizes the current external CoreSTT contract; SparkTransClient does
not own the CoreSTT protocol.

## Endpoint And Lifecycle

CoreSTT endpoint:

```text
ws://127.0.0.1:8020/ws/transcribe
wss://<host>/ws/transcribe
```

SparkTransClient browser/backend code normally talks through this app's proxy:

```text
WS /ws/stt-proxy
```

Normal lifecycle:

```text
connect -> hello -> ready -> start -> binary audio -> realtime/final -> stop -> close
```

Rules:

- Wait for `ready` before presenting the stream as ready.
- Send `{"type":"start"}` before any binary audio packet.
- Send `{"type":"stop"}` when capture ends.
- Stop microphone/file capture immediately when the socket closes.
- Do not buffer unlimited audio while disconnected.
- Reconnect with bounded backoff, then send a new `start` after `ready`.

## Client Control Messages

Text frames must be JSON objects with `type`.

| Type | Purpose | Notes |
|---|---|---|
| `start` | Begin stream/session state. | Optional `domain` must match an advertised profile name. |
| `stop` | End current stream. | Use before closing after recording/file streaming. |
| `clear` | Clear transcript state. | Server may echo `clear` to clients. |
| `ping` | Measure latency. | Server replies with `pong`; browser client sends about every 2.5s. |
| `metrics` | Request diagnostics. | Server replies with `metrics`; avoid high frequency. |

Examples:

```json
{ "type": "start" }
{ "type": "start", "domain": "medical" }
{ "type": "stop" }
{ "type": "ping" }
```

## Domain Profiles

Domain profiles are server-owned transcription hints. They can bias prompts and
hotwords for future streams but do not rewrite final text. Profile edits should
not be expected to change an active recording.

SparkTransClient proxies these CoreSTT HTTP APIs through authenticated app
routes:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/domain-profiles` | List editable profiles and names. |
| `PUT` | `/api/domain-profiles/{name}` | Create or replace one profile. |
| `DELETE` | `/api/domain-profiles/{name}` | Delete one profile. |

Response shape:

```json
{
  "domainProfiles": ["general", "medical"],
  "profiles": {
    "medical": {
      "initial_prompt": "This is medical dictation.",
      "initial_prompt_realtime": "Medical dictation.",
      "hotwords": ["hypertension", "metformin"]
    }
  }
}
```

PUT payload rules:

- `{name}` must be non-empty.
- `initial_prompt` and `initial_prompt_realtime` may be strings or `null`.
- `hotwords` may be a string, string list, omitted, or `null`.
- Invalid profile payloads return HTTP `400`; unknown delete targets return `404`.

Connected clients may receive `domain_profiles_updated`; refresh domain/profile
controls for future `start` commands.

## Binary Audio Packet

Each binary frame must use this exact packet layout:

```text
[uint32 metadataLength little-endian][metadata JSON UTF-8][pcm_s16le audio bytes]
```

| Segment | Rule |
|---|---|
| Metadata length | Unsigned 32-bit little-endian byte length. |
| Metadata | UTF-8 JSON object; maximum `64 KiB`. |
| Audio | Raw signed 16-bit little-endian PCM bytes. |
| Packet cap | Server default `max_audio_packet_bytes` is `512 KiB`. |

Minimal JavaScript encoder:

```ts
export function encodePacket(metadata: Record<string, unknown>, pcmBytes: ArrayBuffer): ArrayBuffer {
  const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata));
  const packet = new ArrayBuffer(4 + metadataBytes.byteLength + pcmBytes.byteLength);
  const view = new DataView(packet);

  view.setUint32(0, metadataBytes.byteLength, true);
  new Uint8Array(packet, 4, metadataBytes.byteLength).set(metadataBytes);
  new Uint8Array(packet, 4 + metadataBytes.byteLength).set(new Uint8Array(pcmBytes));

  return packet;
}
```

## Audio Metadata

Recommended packet metadata:

```json
{
  "sampleRate": 48000,
  "channels": 1,
  "format": "pcm_s16le",
  "frames": 1920,
  "sentAt": 123456.78,
  "sequence": 42,
  "clientPlatform": "web",
  "clientProtocolVersion": "1.0"
}
```

| Field | Required | Rules |
|---|---:|---|
| `sampleRate` | Yes | Positive integer; server resamples internally to `16000 Hz`. |
| `channels` | Recommended | Positive integer, maximum `8`; mono is recommended. |
| `format` | Recommended | Only `pcm_s16le` is supported. |
| `frames` | Optional | If present, must match payload frame count. |
| `sentAt` | Optional | Client timestamp for diagnostics. |
| `sequence` | Optional | Packet sequence number. |
| `clientPlatform` | Optional | Example: `web`, `windows`, `android`, `ios`, `macos`, `python`. |
| `clientProtocolVersion` | Recommended | Use `"1.0"` for current clients. |

Float microphone samples must be clamped to `[-1, 1]` and converted to signed
16-bit PCM. If `channels > 1`, CoreSTT averages channels to mono before
resampling.

Recommended chunk size is `40 ms`; normal range is `20 ms` to `100 ms`.

```text
frames = sampleRate * chunkMs / 1000
bytes = frames * channels * 2
```

## Server Messages

Clients must handle these server message `type` values:

| Type | Purpose | Client handling |
|---|---|---|
| `hello` | Admission/session metadata. | Store `sessionId`/`clientId`; inspect limits/settings/domain names. |
| `ready` | Scheduler/session ready. | Enable recording controls and allow `start`. |
| `status` | Recorder/session state and counters. | Update UI state, diagnostics, selected domain, queue counters. |
| `realtime` | Interim transcript. | Display as non-final; update same `segmentId` instead of appending duplicates. |
| `final` | Final transcript segment. | Commit final text for the `segmentId`. |
| `timeline` | Lifecycle event. | Use for logs, timing, and troubleshooting. |
| `clear` | Clear transcript state. | Clear local transcript/segment state. |
| `warning` | Non-fatal issue. | Log/surface if actionable; keep socket open if capture remains valid. |
| `error` | Fatal or command/audio/domain error. | Stop recording for fatal/admission errors; fix encoding or domain before retry. |
| `pong` | Reply to `ping`. | Measure latency. |
| `metrics` | Diagnostics snapshot. | Use for diagnostics, not transcript rendering. |
| `domain_profiles_updated` | Profile data changed. | Refresh profile controls; do not change active stream domain mid-recording. |

Common error `where` values:

- `admission`: server rejected the session; stop capture and retry later.
- `audio_packet`: client packet encoding is invalid; stop sending audio until fixed.
- `command`: invalid JSON or unknown command.
- `domain`: unknown domain profile; choose advertised `domainProfiles` or omit.

## Client State Machine

| State | Audio allowed |
|---|---|
| `DISCONNECTED` | No |
| `CONNECTING` | No |
| `CONNECTED` | No |
| `READY` | No, send `start` first |
| `STREAMING` | Yes |
| `STOPPING` | No new audio |
| `CLOSED` | No |

## Client-Side Validation

Before sending each binary packet, validate:

- WebSocket is open and client state is `STREAMING`.
- Metadata is a JSON object and encoded metadata is no larger than `64 KiB`.
- `sampleRate` is a positive integer.
- `channels` is a positive integer no greater than `8`.
- `format` is exactly `pcm_s16le`.
- Audio bytes are signed 16-bit little-endian PCM.
- Payload byte length is divisible by `channels * 2`.
- If `frames` is present, `frames * channels * 2 == audio byte length`.
- Packet size is below the advertised/server packet limit when known.

Recommended reconnect backoff:

```text
1s, 2s, 4s, 8s, then cap at 30s
```
