# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: FastAPI service. `main.py` wires app startup, CORS, and rate limiting; `routers/` contains endpoint modules (`auth.py`, `jobs.py`, `resumes.py`, `rankings.py`, `admin.py`); `database.py` defines SQLAlchemy models/session; `nlp_engine.py` handles resume parsing/ranking logic.
- `frontend/`: React + Vite app. Route pages live in `src/pages/`, shared UI in `src/components/`, auth state in `src/context/`, API wrappers in `src/api/index.js`, and static media in `src/assets/`.
- Root files: `docker-compose.yml` (full stack), `docker-compose.dev.yml` (dev stack), and `.env.example` (required secrets template).

## Build, Test, and Development Commands
- `cd backend && pip install -r requirements.txt`: install backend dependencies.
- `cd backend && uvicorn main:app --reload`: run backend at `http://localhost:8000`.
- `cd backend && python migrate.py`: apply the `uploaded_by` column migration for `resumes`.
- `cd frontend && npm install`: install frontend dependencies.
- `cd frontend && npm run dev`: run frontend at `http://localhost:5173`.
- `cd frontend && npm run build`: create production bundle. Use `npm run preview` to serve it locally.
- `cd frontend && npm run lint`: run ESLint checks.
- `docker compose -f docker-compose.dev.yml up --build`: run DB + backend dev services.
- `docker compose up --build`: run production-like frontend/backend/DB stack.

## Coding Style & Naming Conventions
- Python: 4-space indentation, `snake_case` functions/variables, `PascalCase` classes, feature routers split by module under `backend/routers/`.
- React/JS: follow `frontend/eslint.config.js`; use `PascalCase` component/page files (for example `DashboardPage.jsx`) and `camelCase` helpers/hooks.
- Keep API path naming consistent across backend routes and frontend API clients (for example `/jobs` and `jobsAPI`).

## Testing Guidelines
- No first-party automated test suite is committed yet.
- Minimum validation before a PR: run `npm run lint`, verify `GET /health`, and smoke-test changed UI/API flows locally.
- For new tests, prefer `backend/tests/test_*.py` and `frontend/src/__tests__/*.test.jsx`.

## Commit & Pull Request Guidelines
- Match existing commit style: concise imperative subjects (for example `Add ...`, `Fix ...`).
- Keep commits focused; avoid mixing unrelated frontend/backend refactors.
- PRs should include: objective, changed paths, local verification commands/results, linked issue, and UI screenshots/GIFs when relevant.
- Call out schema or environment-variable changes explicitly.

## Security & Configuration Tips
- Do not commit `.env`; copy from `.env.example` and set strong `SECRET_KEY` and `DB_PASSWORD`.
- Treat `backend/uploads/` as sensitive candidate data; never commit real resumes or PII.
