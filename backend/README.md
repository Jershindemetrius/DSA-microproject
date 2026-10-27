# Intelligent Cybersecurity Log Analyzer

This backend exposes a FastAPI API for ingesting security logs, analyzing them with DSA-based detection logic, and returning alerts and summaries.

## Features

- User registration and JWT login
- Log ingestion from JSON, JSON Lines, and plain-text uploads
- DSA-based anomaly counting, sliding windows, top-k analysis, graph correlation, and suspicious IP tracking
- Alert generation and rule configuration
- Dashboard summary endpoints
- SQLite persistence with SQLAlchemy

## Quick start

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python -m app.main
```

The API is available at `/docs` once running.
