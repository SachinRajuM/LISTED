"""
NLP Engine — Resume Screening Core
-----------------------------------
• spaCy         — NER: skills, education, experience extraction
• Sentence-BERT — semantic embeddings for job description + resumes
• FAISS         — efficient cosine similarity search over embeddings
• Rule-based    — skills keyword matching, experience year extraction
"""
 
import re
import io
import logging
from typing import Optional
from pathlib import Path
 
import numpy as np
 
logger = logging.getLogger(__name__)
 
# ── Lazy-loaded models (loaded once on first use) ─────
_nlp = None
_sbert = None
_faiss = None  # imported lazily
 
 
def get_nlp():
    global _nlp
    if _nlp is None:
        try:
            import spacy
            _nlp = spacy.load("en_core_web_sm")
            logger.info("spaCy model loaded: en_core_web_sm")
        except OSError:
            logger.warning("spaCy model not found — run: python -m spacy download en_core_web_sm")
            _nlp = None
    return _nlp
 
 
def get_sbert():
    global _sbert
    if _sbert is None:
        try:
            from sentence_transformers import SentenceTransformer
            _sbert = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("Sentence-BERT model loaded: all-MiniLM-L6-v2")
        except Exception as e:
            logger.warning(f"SBERT load failed: {e}")
            _sbert = None
    return _sbert
 
 
# ── Text extraction ───────────────────────────────────
def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        return text.strip()
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        return ""
 
 
def extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        return "\n".join(p.text for p in doc.paragraphs).strip()
    except Exception as e:
        logger.error(f"DOCX extraction error: {e}")
        return ""
 
 
def extract_text(file_bytes: bytes, filename: str) -> str:
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in (".docx", ".doc"):
        return extract_text_from_docx(file_bytes)
    return file_bytes.decode("utf-8", errors="ignore")
 
 
# ── Entity extraction ─────────────────────────────────
SKILLS_DB = {
    # Languages
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "rust", "ruby", "php",
    "swift", "kotlin", "scala", "r", "matlab", "sql", "bash", "shell",
    # Frontend
    "react", "vue", "angular", "svelte", "nextjs", "next.js", "html", "css", "tailwindcss",
    "sass", "webpack", "vite", "redux", "graphql",
    # Backend
    "node.js", "nodejs", "django", "fastapi", "flask", "spring", "express", "rails",
    "asp.net", "laravel",
    # Data / ML
    "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "keras", "bert", "nlp",
    "machine learning", "deep learning", "computer vision", "data science",
    # Databases
    "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "sqlite", "cassandra",
    # DevOps / Cloud
    "docker", "kubernetes", "aws", "azure", "gcp", "ci/cd", "jenkins", "github actions",
    "terraform", "ansible", "linux",
    # Other
    "rest api", "microservices", "agile", "scrum", "git", "jira",
}
 
EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}")
PHONE_RE = re.compile(r"(\+?\d[\d\s\-().]{7,14}\d)")
EXP_YEAR_RE = re.compile(r"(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)", re.I)
TOTAL_EXP_RE = re.compile(r"(\d{4})\s*[-–]\s*(?:present|current|\d{4})", re.I)
 
 
def extract_entities(text: str) -> dict:
    text_lower = text.lower()
    result = {
        "candidate_name": None,
        "candidate_email": None,
        "candidate_phone": None,
        "extracted_skills": [],
        "education": [],
        "experience_years": None,
    }
 
    # Email
    emails = EMAIL_RE.findall(text)
    if emails:
        result["candidate_email"] = emails[0]
 
    # Phone
    phones = PHONE_RE.findall(text)
    if phones:
        result["candidate_phone"] = phones[0].strip()
 
    # Skills
    found_skills = [s for s in SKILLS_DB if s in text_lower]
    result["extracted_skills"] = sorted(set(found_skills))
 
    # Experience years
    exp_matches = EXP_YEAR_RE.findall(text)
    if exp_matches:
        result["experience_years"] = max(int(m) for m in exp_matches)
    else:
        date_ranges = TOTAL_EXP_RE.findall(text)
        if date_ranges:
            import datetime
            current_year = datetime.datetime.now().year
            result["experience_years"] = current_year - min(int(y) for y in date_ranges)
 
    # Name via spaCy NER
    nlp = get_nlp()
    if nlp:
        doc = nlp(text[:2000])  # only first 2000 chars for speed
        for ent in doc.ents:
            if ent.label_ == "PERSON" and not result["candidate_name"]:
                result["candidate_name"] = ent.text
            elif ent.label_ in ("ORG", "FAC") and "university" in ent.text.lower():
                result["education"].append(ent.text)
 
    return result
 
 
# ── Embedding ─────────────────────────────────────────
def embed_text(text: str) -> Optional[list]:
    """Return SBERT embedding as Python list[float], or None if unavailable."""
    sbert = get_sbert()
    if sbert is None or not text:
        return None
    try:
        emb = sbert.encode(text[:4096], convert_to_numpy=True, normalize_embeddings=True)
        return emb.tolist()
    except Exception as e:
        logger.error(f"Embedding failed: {e}")
        return None
 
 
# ── Scoring ───────────────────────────────────────────
def cosine_similarity(a: list, b: list) -> float:
    va, vb = np.array(a, dtype=np.float32), np.array(b, dtype=np.float32)
    denom = (np.linalg.norm(va) * np.linalg.norm(vb))
    if denom == 0:
        return 0.0
    return float(np.dot(va, vb) / denom)
 
 
def skills_overlap_score(resume_skills: list, jd_text: str) -> float:
    if not resume_skills:
        return 0.0
    jd_lower = jd_text.lower()
    matched = sum(1 for s in resume_skills if s in jd_lower)
    return min(100.0, (matched / max(len(resume_skills), 1)) * 120)  # slightly generous
 
 
def experience_score(resume_years: Optional[float], jd_text: str) -> float:
    required = EXP_YEAR_RE.findall(jd_text)
    if not required:
        return 70.0  # neutral if not specified
    req_years = max(int(y) for y in required)
    if resume_years is None:
        return 40.0
    if resume_years >= req_years:
        return min(100.0, 70 + (resume_years - req_years) * 5)
    return max(10.0, (resume_years / req_years) * 70)
 
 
def compute_score(
    resume_text: str,
    resume_skills: list,
    resume_years: Optional[float],
    resume_embedding: Optional[list],
    jd_text: str,
    jd_embedding: Optional[list],
) -> dict:
    """
    Compute a weighted composite score:
      40% semantic similarity (BERT)
      35% skills overlap
      25% experience match
    """
    # Semantic
    if resume_embedding and jd_embedding:
        sem = cosine_similarity(resume_embedding, jd_embedding) * 100
    else:
        # Fallback: basic keyword overlap
        resume_words = set(resume_text.lower().split())
        jd_words = set(jd_text.lower().split())
        overlap = len(resume_words & jd_words) / max(len(jd_words), 1)
        sem = min(100.0, overlap * 200)
 
    sk = skills_overlap_score(resume_skills, jd_text)
    ex = experience_score(resume_years, jd_text)
 
    composite = (sem * 0.40) + (sk * 0.35) + (ex * 0.25)
 
    return {
        "score": round(composite, 1),
        "semantic_score": round(sem, 1),
        "skills_score": round(sk, 1),
        "experience_score": round(ex, 1),
        "education_score": round((sem + sk) / 2, 1),  # proxy
    }
 
 
def generate_summary(candidate_name: str, score: float, skills: list, experience_years: Optional[float]) -> str:
    name = candidate_name or "This candidate"
    level = "Excellent" if score >= 80 else "Good" if score >= 65 else "Average" if score >= 45 else "Below average"
    exp_str = f"{int(experience_years)} years of experience" if experience_years else "unspecified experience"
    top_skills = ", ".join(skills[:4]) if skills else "no specific skills detected"
    return f"{level} match. {name} has {exp_str}. Top detected skills: {top_skills}. Overall fit score: {score}%."
 
 
# ── FAISS batch ranking ───────────────────────────────
def faiss_rank(job_embedding: list, resume_embeddings: list[dict]) -> list[dict]:
    """
    Use FAISS to rank resumes by cosine distance to the job embedding.
    resume_embeddings: list of {'id': int, 'embedding': list[float]}
    Returns sorted list with 'id' and 'similarity' (0-100).
    """
    try:
        import faiss
        if not resume_embeddings:
            return []
 
        dim = len(job_embedding)
        index = faiss.IndexFlatIP(dim)  # Inner product (cosine if normalized)
        matrix = np.array([r["embedding"] for r in resume_embeddings], dtype=np.float32)
        faiss.normalize_L2(matrix)
        index.add(matrix)
 
        query = np.array([job_embedding], dtype=np.float32)
        faiss.normalize_L2(query)
        distances, indices = index.search(query, len(resume_embeddings))
 
        ranked = []
        for dist, idx in zip(distances[0], indices[0]):
            ranked.append({
                "id": resume_embeddings[idx]["id"],
                "similarity": round(float(dist) * 100, 1)
            })
        return ranked
    except ImportError:
        logger.warning("FAISS not available — falling back to numpy cosine")
        results = []
        for r in resume_embeddings:
            sim = cosine_similarity(job_embedding, r["embedding"]) * 100
            results.append({"id": r["id"], "similarity": round(sim, 1)})
        return sorted(results, key=lambda x: x["similarity"], reverse=True)
 