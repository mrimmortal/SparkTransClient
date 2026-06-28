# SparkTransClient

Production-oriented multipurpose dictation workspace built with React, FastAPI,
and the existing CoreSTT WebSocket service.

CoreSTT remains a separate transcription service. This app owns documents,
templates, macros, settings, authentication, logging, exports, and UI behavior.

## Project Structure

```text
backend/    FastAPI app, SQLite models, auth, resources, exports, STT proxy
frontend/   React/Vite UI, feature modules, API/STT browser clients
scripts/    Local development and deployment wrappers
docs/       Command, module, API, user, progress, and session docs
```

Frontend UI is organized under `frontend/src/features/` with a small
`frontend/src/App.tsx` composition root. Core frontend flow helpers remain in
`frontend/src/lib/`.

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

## Deployment

There are two deployment modes: Docker Compose and direct terminal startup.

### Docker

Linux/macOS:

```bash
./scripts/deploy-docker-linux.sh up
./scripts/deploy-docker-linux.sh logs
./scripts/deploy-docker-linux.sh down
```

Windows PowerShell:

```powershell
.\scripts\deploy-docker-windows.ps1 -Action up
.\scripts\deploy-docker-windows.ps1 -Action logs
.\scripts\deploy-docker-windows.ps1 -Action down
```

Docker deployment uses `docker-compose.yml`, builds both services, runs
containers in the background, and exposes:

```text
Frontend: http://localhost:8080
Backend:  http://localhost:8000
```

### Direct Terminal

Linux/macOS:

```bash
./scripts/deploy-terminal-linux.sh up
```

Windows PowerShell:

```powershell
.\scripts\deploy-terminal-windows.ps1 -Action up
```

Direct terminal deployment installs dependencies, seeds the sample user, builds
the frontend, starts FastAPI, and starts Vite preview in the foreground:

```text
Frontend: http://127.0.0.1:8080
Backend:  http://127.0.0.1:8000
```

Use Docker for server-style deployment. Use direct terminal startup when Docker
is unavailable or when you want to run both services visibly in the terminal.
The terminal wrappers require Python 3.12+ and Node.js 22+ with npm. They try
to install missing runtimes with the available OS package manager and print
manual install instructions when automatic installation is unavailable.

## Manual Commands

See `docs/COMMANDS.md`.

## Validation

Common checks:

```bash
cd frontend && npm test
cd frontend && npm run build
cd backend && .venv/bin/pytest -q
```

## Production Notes

- Serve over HTTPS/WSS behind Nginx or Caddy.
- Use the FastAPI STT proxy in production unless CoreSTT is independently
  secured and not exposed over an untrusted network.
- Keep secrets in environment variables. Do not commit real `.env` files.
- Mount the SQLite database directory as a persistent Docker volume.
- Do not use the sample user account in production.
