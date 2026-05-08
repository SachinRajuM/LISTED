# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RecruitAI — AI-powered resume screening and ranking system. Full-stack app with a FastAPI backend (Python) and React frontend, containerized with Docker.

## Tech Stack

- **Backend**: Python 3.11, FastAPI, SQLAlchemy (ORM), PostgreSQL 15, slowapi (rate limiting)
- **NLP**: spaCy (NER), Sentence-BERT (embeddings), FAISS (similarity search), PyPDF2 + python-docx (text extraction)
- **Frontend**: React 19, Vite, Tailwind CSS, React Router, Axios, Recharts, react-toastify
- **Infra**: Docker + docker-compose, nginx (serves frontend + proxies `/api/*` to backend)

## Repo Structure

```
├── docker-compose.yml          # Production: full stack (db + backend + frontend + seeder)
├── docker-compose.dev.yml      # Dev: DB in Docker only, backend hot-reload with live source
├── .env.example                # Copy to .env; sets DB_PASSWORD and SECRET_KEY
├── backend/
│   ├── main.py                 # FastAPI app setup, CORS, router registration, lifespan
│   ├── config.py               # pydantic_settings, loads from .env, singleton via lru_cache
│   ├── database.py             # SQLAlchemy engine, SessionLocal, models (User, Job, Resume)
│   ├── schemas.py              # Pydantic request/response models
│   ├── auth.py                 # bcrypt hashing, JWT encode/decode, `get_current_user` / role guards
│   ├── nlp_engine.py           # Text extraction, entity extraction, SBERT embedding, scoring, FAISS ranking
│   ├── limiter.py              # Shared slowapi Limiter (avoids circular import with main)
│   ├── seed.py                 # Seeds admin/recruiter users + sample jobs
│   ├── migrate.py              # Manual one-shot DB migration script
│   └── routers/
│       ├── auth.py             # POST /auth/register, /auth/login, /auth/me
│       ├── jobs.py             # CRUD for Job postings
│       ├── resumes.py           # POST /resumes/upload/{job_id}, process (NLP + embedding)
│       ├── rankings.py          # POST /rank/{job_id} (AI ranking), GET /rank/{job_id}/results, /export-csv
│       └── admin.py             # Admin analytics and user management
└── frontend/
    ├── src/main.jsx             # Entry point
    ├── src/App.jsx              # Routes, auth guards, role-based routing
    ├── src/api/index.js         # Axios client with JWT interceptor; all API calls live here
    ├── src/context/AuthContext.jsx # JWT auth state, login/logout, role helpers
    ├── src/components/Layout.jsx   # Sidebar-based layout for recruiter/admin routes
    └── src/pages/
```

## Common Commands

### Development (Full stack via Docker)

```bash
# Start everything (first time: copy .env, seed DB)
cp .env.example .env
docker-compose up --build -d        # Production
docker-compose -f docker-compose.dev.yml up --build -d  # Dev (hot reload)

# Seed the database (first time only)
docker-compose run --rm seeder
```

### Frontend (standalone)

```bash
cd frontend
npm install
npm run dev             # Dev server: http://localhost:5173
npm run build           # Production build
npm run lint            # ESLint (flat config, checks .js/.jsx)
```

- The Vite dev server proxies `/api` → `http://localhost:8000` (config in `vite.config.js`).
- In production, nginx handles `/api/*` proxying to the backend container.

### Backend (standalone)

```bash
cd backend
# virtualenv recommended
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend expects environment variables (see `.env.example`):
- `DATABASE_URL` — defaults to `postgresql://postgres:password@localhost:5432/recruitai`
- `SECRET_KEY` — JWT signing key (≥32 chars)
- `UPLOAD_DIR` — resume uploads directory

### Database

```bash
# Manual migration (run inside backend container or standalone)
python migrate.py

# Seed data (admin: admin@recruitai.com / admin123, recruiter: recruiter@recruitai.com / recruiter123)
python seed.py
```

## Architecture Notes

### NLP Pipeline (upload → score)

1. **Resume upload** (`routers/resumes.py`): File saved to disk, `Resume` record created (status=`uploaded`).
2. **Async processing** (same endpoint, synchronous): `extract_text()` → `extract_entities()` → `embed_text()` → DB commit (status=`processed`).
3. **Ranking** (`routers/rankings.py`): `POST /rank/{job_id}` computes weighted composite score:
   - 40% semantic similarity (SBERT cosine, FAISS for batch)
   - 35% skills overlap (keyword matching against `SKILLS_DB` in `nlp_engine.py`)
   - 25% experience match
   - Fallback to basic keyword overlap if SBERT/FAISS unavailable.
4. **Results**: `GET /rank/{job_id}/results` returns scored list; `GET /rank/{job_id}/export-csv` downloads Excel-compatible CSV.

### Auth & Authorization

- JWT tokens, bearer-based. Token stored in `localStorage` on frontend.
- Roles: `admin`, `recruiter`, `hiring_manager`, `end_user`.
- Role guards: `require_recruiter`, `require_admin` in `auth.py`.
- End users have a separate route set (no sidebar layout) in `App.jsx` (`EndUserPage` / `/portal`).

### Rate Limiting (slowapi)

Limiter instance is defined in `backend/limiter.py` and imported by both `main.py` and all routers. Key limits:
- `POST /auth/login`: 10/minute
- `POST /auth/register`: 5/minute
- `POST /resumes/upload`: 30/minute
- `POST /rank/{id}`: 10/minute
- Default: 200/minute

### Frontend Routing & Auth

- `AuthProvider` wraps entire app.
- API client (`src/api/index.js`) attaches JWT header and intercepts 401 to redirect to `/signin`.
- `SmartDashboard` routes `end_user` role to `EndUserPage` (portal), others to `DashboardPage`.

## Important Files to Know

| Purpose | File |
|---------|------|
| Backend entry | `backend/main.py` |
| DB models | `backend/database.py` |
| Pydantic schemas | `backend/schemas.py` |
| NLP core | `backend/nlp_engine.py` |
| Frontend entry | `frontend/src/main.jsx` |
| Frontend routes | `frontend/src/App.jsx` |
| API client | `frontend/src/api/index.js` |
| Auth context | `frontend/src/context/AuthContext.jsx` |
| Tailwind config | `frontend/tailwind.config.js` |

## Environment

- Backend runs on port 8000.
- Frontend dev server on 5173 (via Vite), frontend nginx on 80 (Docker).
- PostgreSQL on 5432.
- Default admin credentials: `admin@recruitai.com` / `admin123`
