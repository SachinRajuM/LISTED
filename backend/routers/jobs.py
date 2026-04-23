from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
 
from database import get_db, Job, Resume, User
from schemas import JobCreate, JobUpdate, JobOut, JobListResponse
from auth import get_current_user, require_recruiter
 
router = APIRouter(prefix="/jobs", tags=["jobs"])
 
 
def _job_out(job: Job, db: Session) -> dict:
    count = db.query(func.count(Resume.id)).filter(Resume.job_id == job.id).scalar()
    data = JobOut.model_validate(job).model_dump()
    data["resume_count"] = count
    return data
 
 
@router.get("", response_model=JobListResponse)
def list_jobs(
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Job).filter(Job.is_active == True)
    if search:
        q = q.filter(Job.title.ilike(f"%{search}%") | Job.department.ilike(f"%{search}%"))
    total = q.count()
    jobs = q.order_by(Job.created_at.desc()).offset(offset).limit(limit).all()
    return JobListResponse(items=[_job_out(j, db) for j in jobs], total=total)
 
 
@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _job_out(job, db)
 
 
@router.post("", response_model=JobOut, status_code=201)
def create_job(
    data: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    job = Job(**data.model_dump(), created_by=current_user.id)
    db.add(job)
    db.commit()
    db.refresh(job)
    return _job_out(job, db)
 
 
@router.put("/{job_id}", response_model=JobOut)
def update_job(
    job_id: int,
    data: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(job, field, val)
    db.commit()
    db.refresh(job)
    return _job_out(job, db)
 
 
@router.delete("/{job_id}", status_code=204)
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(job)
    db.commit()
 