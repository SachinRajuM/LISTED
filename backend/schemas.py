from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
 
 
# ── Auth ──────────────────────────────────────────────
class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=200)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: str = "end_user"
 
 
class UserLogin(BaseModel):
    email: EmailStr
    password: str
 
 
class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
 
    class Config:
        from_attributes = True
 
 
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
 
 
# ── Jobs ──────────────────────────────────────────────
class JobCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=300)
    department: Optional[str] = None
    location: Optional[str] = None
    description: str = Field(..., min_length=20)
    requirements: Optional[str] = None
    employment_type: str = "full_time"
 
 
class JobUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    employment_type: Optional[str] = None
    is_active: Optional[bool] = None
 
 
class JobOut(BaseModel):
    id: int
    title: str
    department: Optional[str]
    location: Optional[str]
    description: str
    requirements: Optional[str]
    employment_type: str
    is_active: bool
    created_by: int
    created_at: datetime
    resume_count: Optional[int] = 0
 
    class Config:
        from_attributes = True
 
 
class JobListResponse(BaseModel):
    items: List[JobOut]
    total: int
 
 
# ── Resumes ───────────────────────────────────────────
class ResumeOut(BaseModel):
    id: int
    job_id: int
    filename: str
    candidate_name: Optional[str]
    candidate_email: Optional[str]
    extracted_skills: Optional[List[str]] = []
    score: Optional[float]
    skills_score: Optional[float]
    experience_score: Optional[float]
    education_score: Optional[float]
    semantic_score: Optional[float]
    summary: Optional[str]
    status: str
    uploaded_at: datetime
 
    class Config:
        from_attributes = True
 
 
class ResumeListResponse(BaseModel):
    items: List[ResumeOut]
    total: int
 
 
# ── Rankings ──────────────────────────────────────────
class RankingResult(BaseModel):
    id: int
    candidate_name: Optional[str]
    candidate_email: Optional[str]
    score: float
    skills_score: Optional[float]
    experience_score: Optional[float]
    education_score: Optional[float]
    semantic_score: Optional[float]
    extracted_skills: Optional[List[str]] = []
    summary: Optional[str]
    rank: int
 
    class Config:
        from_attributes = True
 
 
class RankingResponse(BaseModel):
    job_id: int
    total: int
    results: List[RankingResult]
 
 
# ── Admin ─────────────────────────────────────────────
class AdminOverview(BaseModel):
    total_users: int
    total_jobs: int
    total_resumes: int
    total_rankings: int
 
 
class UpdateRole(BaseModel):
    role: str
 