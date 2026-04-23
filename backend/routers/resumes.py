import uuid
from datetime import datetime
from pathlib import Path
 
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session
 
from config import settings
from database import get_db, Job, Resume, ResumeStatus, User
from schemas import ResumeOut, ResumeListResponse
from auth import get_current_user, require_recruiter
from nlp_engine import extract_text, extract_entities, embed_text
from limiter import limiter           # ← from limiter.py, not main
 
router = APIRouter(prefix="/resumes", tags=["resumes"])
 
UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(exist_ok=True)
MAX_SIZE    = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
ALLOWED_EXTS = {".pdf", ".docx", ".doc"}
 
 
@router.post("/upload/{job_id}", response_model=ResumeOut, status_code=201)
@limiter.limit("30/minute")
async def upload_resume(
    request: Request,
    job_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == job_id, Job.is_active == True).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
 
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(status_code=400, detail=f"File type {ext} not allowed. Use PDF or DOCX.")
 
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large. Max {settings.MAX_UPLOAD_SIZE_MB}MB.")
 
    safe_name = f"{uuid.uuid4().hex}_{file.filename}"
    job_dir   = UPLOAD_DIR / str(job_id)
    job_dir.mkdir(exist_ok=True)
    filepath  = job_dir / safe_name
    filepath.write_bytes(content)
 
    resume = Resume(
        job_id=job_id,
        filename=file.filename,
        filepath=str(filepath),
        status=ResumeStatus.uploaded,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
 
    try:
        resume.status = ResumeStatus.processing
        db.commit()
 
        extracted_text = extract_text(content, file.filename)
        entities       = extract_entities(extracted_text)
        embedding      = embed_text(extracted_text)
 
        resume.extracted_text  = extracted_text[:50000]
        resume.candidate_name  = entities.get("candidate_name")
        resume.candidate_email = entities.get("candidate_email")
        resume.candidate_phone = entities.get("candidate_phone")
        resume.extracted_skills = entities.get("extracted_skills", [])
        resume.education        = entities.get("education", [])
        resume.experience_years = entities.get("experience_years")
        resume.embedding        = embedding
        resume.status           = ResumeStatus.processed
        resume.processed_at     = datetime.utcnow()
        db.commit()
        db.refresh(resume)
    except Exception as e:
        resume.status = ResumeStatus.failed
        db.commit()
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
 
    return resume
 
 
@router.get("/{job_id}", response_model=ResumeListResponse)
def list_resumes(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    resumes = db.query(Resume).filter(Resume.job_id == job_id).order_by(Resume.uploaded_at.desc()).all()
    return ResumeListResponse(items=resumes, total=len(resumes))
 
 
@router.get("/detail/{resume_id}", response_model=ResumeOut)
def get_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume
 
 
@router.delete("/{resume_id}", status_code=204)
def delete_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    try:
        Path(resume.filepath).unlink(missing_ok=True)
    except Exception:
        pass
    db.delete(resume)
    db.commit()
 