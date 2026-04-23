# RecruitAI — Docker Deployment Guide

## Project Structure
```
resume-screening/
├── docker-compose.yml          ← Production
├── docker-compose.dev.yml      ← Dev (DB only in Docker)
├── .env.example                ← Copy to .env
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── ...
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── ...
```

---

## Quick Start (Production)

### 1. Create your .env file
```bash
cp .env.example .env
```
Edit `.env`:
```env
DB_PASSWORD=your_secure_password
SECRET_KEY=run_python_-c_import_secrets_print_secrets.token_hex_32
```

### 2. Build and start all services
```bash
docker-compose up --build -d
```

### 3. Seed the database (first time only)
```bash
docker-compose run --rm seeder
```

### 4. Open the app
- Frontend:  http://localhost
- API docs:  http://localhost:8000/docs
- Health:    http://localhost:8000/health

Default credentials:
- Admin:     admin@recruitai.com / admin123
- Recruiter: recruiter@recruitai.com / recruiter123

---

## Services

| Service  | Port | Description                    |
|----------|------|-------------------------------|
| frontend | 80   | React app served by nginx     |
| backend  | 8000 | FastAPI + uvicorn              |
| db       | 5432 | PostgreSQL 15                 |

---

## Rate Limits

| Endpoint              | Limit         | Reason                    |
|-----------------------|---------------|---------------------------|
| POST /auth/login      | 10 / minute   | Brute force protection    |
| POST /auth/register   | 5 / minute    | Spam prevention           |
| POST /resumes/upload  | 30 / minute   | Storage protection        |
| POST /rank/{id}       | 10 / minute   | CPU-heavy AI operation    |
| All other endpoints   | 200 / minute  | Global default            |

When a limit is exceeded, the API returns **429 Too Many Requests**.
The frontend shows a toast notification automatically.

---

## Useful Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# Restart a service
docker-compose restart backend

# Stop everything
docker-compose down

# Stop and delete all data (WARNING: deletes DB)
docker-compose down -v

# Rebuild after code changes
docker-compose up --build -d backend
docker-compose up --build -d frontend

# Run database migration
docker-compose exec backend python migrate.py

# Open psql shell
docker-compose exec db psql -U postgres -d recruitai

# Check running containers
docker-compose ps
```

---

## Windows-specific Notes

On Windows use PowerShell or Git Bash:
```powershell
# Install Docker Desktop first from:
# https://www.docker.com/products/docker-desktop/

# Then in PowerShell:
cd D:\lis
docker-compose up --build -d
```

---

## Architecture in Docker

```
Browser
   │
   ▼ :80
┌─────────┐
│  nginx  │  serves React static files
│ (front) │  proxies /api/* → backend:8000
└────┬────┘
     │ :8000
     ▼
┌─────────┐
│ FastAPI │  rate limiting via slowapi
│(backend)│  NLP: spaCy + BERT + FAISS
└────┬────┘
     │ :5432
     ▼
┌─────────┐
│Postgres │  persistent volume
│  (db)   │
└─────────┘
```
