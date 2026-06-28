# Commands

## Full local run

```bash
./scripts/run-dev.sh
```

This installs missing dependencies, seeds the sample user, starts FastAPI on
`http://127.0.0.1:8000`, and starts Vite on `http://127.0.0.1:5173`.

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
pytest -q
```

Backend logs are written to stdout as JSON lines. STT proxy events use names
such as `stt_proxy_connect`, `stt_proxy_client_frame`,
`stt_proxy_corestt_frame`, `stt_proxy_disconnect`, and `stt_proxy_error`.
Frame logs include direction, frame type, and byte counts; they do not include
transcript text or audio payloads.

Seed sample user:

```bash
cd backend
.venv/bin/python scripts/seed_sample_user.py
```

## Frontend

```bash
cd frontend
npm install
npm run dev
npm run build
npm test
npm audit --audit-level=high
```

## Deployment

```bash
docker compose up --build
```

Docker deployment wrappers:

```bash
./scripts/deploy-docker-linux.sh up
./scripts/deploy-docker-linux.sh logs
./scripts/deploy-docker-linux.sh down
```

```powershell
.\scripts\deploy-docker-windows.ps1 -Action up
.\scripts\deploy-docker-windows.ps1 -Action logs
.\scripts\deploy-docker-windows.ps1 -Action down
```

Direct terminal deployment wrappers:

```bash
./scripts/deploy-terminal-mac.sh up
```

```bash
./scripts/deploy-terminal-linux.sh up
```

```powershell
.\scripts\deploy-terminal-windows.ps1 -Action up
```

The Docker wrappers use `docker-compose.yml`, build images, run containers in
the background, and expose the frontend on `http://localhost:8080` and backend
on `http://localhost:8000`.

The terminal wrappers install dependencies, seed the sample user, build the
frontend, start FastAPI on `http://127.0.0.1:8000`, and start Vite preview on
`http://127.0.0.1:8080` in the foreground.

The terminal wrappers require Python 3.12+ and Node.js 22+ with npm. If a
runtime is missing or unsupported, the wrapper asks before installing it with
the platform package manager. If installation is declined or unavailable, it
prints a manual install message and exits.

## Sample login

```text
Email: sample@sparktrans.app
Password: SampleUser123!
```
