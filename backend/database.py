from datetime import datetime
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Boolean,
    DateTime, Text, ForeignKey, JSON, Enum as SAEnum
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
import enum
 
from config import settings
 
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
 
 
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
 
 
# ── Enums ─────────────────────────────────────────────
class UserRole(str, enum.Enum):
    admin = "admin"
    recruiter = "recruiter"
    hiring_manager = "hiring_manager"
    end_user = "end_user"
 
 
class EmploymentType(str, enum.Enum):
    full_time = "full_time"
    part_time = "part_time"
    contract = "contract"
    internship = "internship"
 
 
class ResumeStatus(str, enum.Enum):
    uploaded = "uploaded"
    processing = "processing"
    processed = "processed"
    failed = "failed"
 
 
# ── Models ────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(200), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.end_user, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
 
    jobs = relationship("Job", back_populates="creator")
 
 
class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    department = Column(String(200))
    location = Column(String(200))
    description = Column(Text, nullable=False)
    requirements = Column(Text)
    employment_type = Column(SAEnum(EmploymentType), default=EmploymentType.full_time)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
 
    creator = relationship("User", back_populates="jobs")
    resumes = relationship("Resume", back_populates="job", cascade="all, delete-orphan")
 
 
class Resume(Base):
    __tablename__ = "resumes"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    filename = Column(String(500), nullable=False)
    filepath = Column(String(1000), nullable=False)
    candidate_name = Column(String(300))
    candidate_email = Column(String(255))
    candidate_phone = Column(String(50))
    extracted_text = Column(Text)
    extracted_skills = Column(JSON, default=list)
    education = Column(JSON, default=list)
    experience_years = Column(Float)
    embedding = Column(JSON)  # stored as list[float]
 
    # Scoring
    score = Column(Float)
    skills_score = Column(Float)
    experience_score = Column(Float)
    education_score = Column(Float)
    semantic_score = Column(Float)
    summary = Column(Text)
 
    status = Column(SAEnum(ResumeStatus), default=ResumeStatus.uploaded)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime)
 
    job = relationship("Job", back_populates="resumes")
 
 
def create_tables():
    Base.metadata.create_all(bind=engine)
 