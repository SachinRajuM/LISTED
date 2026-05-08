# RecruitAI — AI-Powered Resume Screening & Ranking System

## Overview

RecruitAI is an AI-powered resume screening and ranking platform designed to help recruiters and hiring managers automate candidate evaluation using Natural Language Processing (NLP), semantic similarity search, and intelligent ranking algorithms.

The system extracts information from resumes, analyzes candidate-job relevance using AI models, and ranks applicants based on skills, semantic similarity, and experience matching.

---

# Features

## AI/NLP Features

* Resume parsing from PDF and DOCX files
* Named Entity Recognition (NER) using spaCy
* Semantic similarity matching using Sentence-BERT
* Candidate ranking using weighted AI scoring
* FAISS-based fast similarity search
* Skills extraction and overlap analysis
* Experience-based candidate evaluation

---

## Backend Features

* FastAPI REST API architecture
* PostgreSQL database integration
* JWT authentication
* Role-based authorization
* Secure password hashing using bcrypt
* Rate limiting with slowapi
* Dockerized backend deployment
* Structured modular architecture

---

## Frontend Features

* React + Vite frontend
* Tailwind CSS responsive UI
* Protected routes and authentication
* Dashboard analytics
* Recruiter and admin panels
* Axios API integration
* Recharts-based visualizations

---

# Tech Stack

## Backend

* Python 3.11
* FastAPI
* SQLAlchemy
* PostgreSQL
* JWT Authentication
* bcrypt
* slowapi

---

## AI / NLP

* spaCy
* Sentence-BERT
* FAISS
* PyPDF2
* python-docx

---

## Frontend

* React 19
* Vite
* Tailwind CSS
* React Router
* Axios
* Recharts

---

## DevOps / Infrastructure

* Docker
* Docker Compose
* nginx

---

# Project Architecture

```text
Frontend (React + Tailwind)
        │
        ▼
FastAPI Backend (REST APIs)
        │
 ┌──────┴──────┐
 │             │
 ▼             ▼
PostgreSQL     NLP Engine
(Database)     (spaCy + SBERT + FAISS)
```

---

# Folder Structure

```text
RecruitAI/
│
├── backend/
│   ├── routers/
│   ├── auth.py
│   ├── database.py
│   ├── nlp_engine.py
│   ├── schemas.py
│   ├── config.py
│   └── main.py
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── vite.config.js
│
├── docker-compose.yml
├── docker-compose.dev.yml
└── README.md
```

---

# AI Ranking Algorithm

The ranking system calculates a weighted composite score:

| Component           | Weight |
| ------------------- | ------ |
| Semantic Similarity | 40%    |
| Skills Matching     | 35%    |
| Experience Match    | 25%    |

---

# Resume Processing Pipeline

1. Resume Upload
2. Text Extraction
3. Entity Extraction
4. Embedding Generation
5. Semantic Analysis
6. Candidate Ranking
7. Dashboard Visualization

---

# Authentication & Authorization

The system implements:

* JWT-based authentication
* Role-Based Access Control (RBAC)

Supported roles:

* Admin
* Recruiter
* Hiring Manager
* End User

---

# Security Features

* Password hashing using bcrypt
* JWT token authentication
* Role-based route protection
* API rate limiting
* Secure backend architecture

> Note: Passwords are securely hashed before database storage. Resume and personal identity information are currently stored in plain text and can be enhanced in future versions using encryption techniques.

---

# Installation

## Clone Repository

```bash
git clone <your-repository-url>
cd RecruitAI
```

---

# Backend Setup

```bash
cd backend

pip install -r requirements.txt

python -m spacy download en_core_web_sm

uvicorn main:app --reload
```

Backend runs on:

```text
http://localhost:8000
```

---

# Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

# Docker Setup

## Production

```bash
docker-compose up --build
```

---

## Development

```bash
docker-compose -f docker-compose.dev.yml up --build
```

---

# Environment Variables

Create a `.env` file:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/recruitai
SECRET_KEY=your_secret_key
UPLOAD_DIR=uploads
```

---

# Database

PostgreSQL is used for:

* user management
* job postings
* resume storage
* ranking data

Default database:

```text
recruitai
```

---

# API Endpoints

## Authentication

* `POST /auth/register`
* `POST /auth/login`
* `GET /auth/me`

---

## Jobs

* `POST /jobs`
* `GET /jobs`
* `PUT /jobs/{id}`
* `DELETE /jobs/{id}`

---

## Resume Processing

* `POST /resumes/upload/{job_id}`

---

## AI Ranking

* `POST /rank/{job_id}`
* `GET /rank/{job_id}/results`
* `GET /rank/{job_id}/export-csv`

---

# Future Improvements

* Resume encryption
* Explainable AI scoring
* Interview question generation
* LLM integration
* Redis/Celery background jobs
* Vector database integration
* Advanced analytics dashboard

---

# Screenshots

Add project screenshots here:

```text
/docs/screenshots/
```

Suggested screenshots:

* Login page
* Dashboard
* Resume upload
* Ranking results
* Analytics charts

---

# Learning Outcomes

This project helped in understanding:

* Full-stack web development
* AI-powered semantic search
* NLP pipelines
* Authentication systems
* Database design
* Docker deployment
* Backend architecture
* Production-style API development

---

# Author

Sachin Rajum

---

# License

This project is for educational and learning purposes.
