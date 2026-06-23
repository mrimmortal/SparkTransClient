# SparkTransClient

Production-oriented multipurpose dictation workspace built with React, FastAPI,
and the existing CoreSTT WebSocket service.

CoreSTT remains a separate transcription service. This app owns documents,
templates, macros, settings, authentication, logging, exports, and UI behavior.

## Local Development

One-command startup:

```bash
./scripts/run-dev.sh
```

Then open:

```text
http://127.0.0.1:5173/
```

Sample login:

```text
Email: sample@sparktrans.app
Password: SampleUser123!
```

CoreSTT local default is `ws://127.0.0.1:8020/ws/transcribe`.
The UI works without CoreSTT for editing/testing, but real dictation requires CoreSTT.

See `docs/USER_MANUAL.md` for the user workflow.

## Manual Commands

See `docs/COMMANDS.md`.

## Production Notes

- Serve over HTTPS/WSS behind Nginx or Caddy.
- Use the FastAPI STT proxy in production unless CoreSTT is independently
  secured and not exposed over an untrusted network.
- Keep secrets in environment variables. Do not commit real `.env` files.
- Mount the SQLite database directory as a persistent Docker volume.
- Do not use the sample user account in production.
