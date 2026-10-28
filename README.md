# Intelligent Cybersecurity Log Analyzer and Threat Detector

The project contains a FastAPI backend and a Vite/React frontend. The frontend uses the authenticated backend API for logs, analysis, alerts, dashboard summaries, reports, and detection rules.

## Run the backend

From the repository root in PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
python -m app.main
```

The API and interactive documentation are available at `http://localhost:8000` and `http://localhost:8000/docs`.

## Run the frontend

In a second terminal from the repository root:

```powershell
cd frontend
npm ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm run dev
```

Vite runs at `http://localhost:5173`. The backend's default CORS configuration allows this origin.

## Configuration

Set `VITE_API_BASE_URL` in `frontend/.env` to the backend API base URL, including `/api/v1` (for example `http://localhost:8000/api/v1`). This variable is public frontend configuration; do not put credentials or backend secrets in it.

Backend settings, including allowed frontend origins, upload-size limits, database URL, and signing key, belong in `backend/.env`. See `backend/.env.example`. The backend defaults to SQLite and allows frontend origins `http://localhost:3000` and `http://localhost:5173`.

Logs, alerts, and detection rules created after the ownership migration are scoped to the signed-in account. Existing rows are deliberately left unowned by the automatic migration and are not exposed through authenticated endpoints; re-upload legacy logs under the intended account if they should be available there.

## Tests and build

```powershell
cd backend
python -m pytest -q
cd ..\frontend
npm run build
```
