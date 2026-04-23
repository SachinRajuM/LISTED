import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
 
from database import get_db, Job, Resume, ResumeStatus, User
from schemas import RankingResponse, RankingResult
from fastapi import APIRouter, Depends, HTTPException, Request
from auth import get_current_user, require_recruiter
from nlp_engine import embed_text, compute_score, generate_summary, faiss_rank
from limiter import limiter
 
router = APIRouter(prefix="/rank", tags=["rankings"])
 
 
@router.post("/{job_id}")
@limiter.limit("10/minute")   # ranking is CPU-heavy
def run_ranking(
    request: Request,
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
 
    resumes = db.query(Resume).filter(
        Resume.job_id == job_id,
        Resume.status == ResumeStatus.processed
    ).all()
 
    if not resumes:
        raise HTTPException(
            status_code=400,
            detail="No processed resumes found. Upload resumes first."
        )
 
    jd_text = f"{job.title}\n{job.description}\n{job.requirements or ''}"
    jd_embedding = embed_text(jd_text)
 
    faiss_input = [{"id": r.id, "embedding": r.embedding} for r in resumes if r.embedding]
    faiss_scores = {}
    if faiss_input and jd_embedding:
        ranked = faiss_rank(jd_embedding, faiss_input)
        faiss_scores = {item["id"]: item["similarity"] for item in ranked}
 
    scored_count = 0
    for resume in resumes:
        try:
            scores = compute_score(
                resume_text=resume.extracted_text or "",
                resume_skills=resume.extracted_skills or [],
                resume_years=resume.experience_years,
                resume_embedding=resume.embedding,
                jd_text=jd_text,
                jd_embedding=jd_embedding,
            )
            if resume.id in faiss_scores:
                faiss_sim = faiss_scores[resume.id]
                scores["semantic_score"] = round((scores["semantic_score"] + faiss_sim) / 2, 1)
                scores["score"] = round(
                    scores["semantic_score"] * 0.40 +
                    scores["skills_score"] * 0.35 +
                    scores["experience_score"] * 0.25, 1
                )
            resume.score = scores["score"]
            resume.semantic_score = scores["semantic_score"]
            resume.skills_score = scores["skills_score"]
            resume.experience_score = scores["experience_score"]
            resume.education_score = scores["education_score"]
            resume.summary = generate_summary(
                resume.candidate_name, scores["score"],
                resume.extracted_skills or [], resume.experience_years
            )
            scored_count += 1
        except Exception:
            continue
 
    db.commit()
    return {
        "message": f"Ranking complete. {scored_count}/{len(resumes)} resumes scored.",
        "job_id": job_id,
        "scored": scored_count,
        "total": len(resumes),
    }
 
 
@router.get("/{job_id}/results", response_model=RankingResponse)
def get_ranking_results(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
 
    resumes = (
        db.query(Resume)
        .filter(Resume.job_id == job_id, Resume.score.isnot(None))
        .order_by(Resume.score.desc())
        .all()
    )
 
    results = [
        RankingResult(
            id=r.id,
            candidate_name=r.candidate_name,
            candidate_email=r.candidate_email,
            score=r.score or 0,
            skills_score=r.skills_score,
            experience_score=r.experience_score,
            education_score=r.education_score,
            semantic_score=r.semantic_score,
            extracted_skills=r.extracted_skills or [],
            summary=r.summary,
            rank=i + 1,
        )
        for i, r in enumerate(resumes)
    ]
    return RankingResponse(job_id=job_id, total=len(results), results=results)
 
 
@router.get("/{job_id}/export-csv")
def export_csv(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download ranking results as a properly formatted CSV file."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
 
    resumes = (
        db.query(Resume)
        .filter(Resume.job_id == job_id, Resume.score.isnot(None))
        .order_by(Resume.score.desc())
        .all()
    )
 
    if not resumes:
        raise HTTPException(status_code=404, detail="No ranked results found. Run AI ranking first.")
 
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_ALL)
 
    # Header
    writer.writerow([
        "Rank",
        "Candidate Name",
        "Email",
        "Phone",
        "Overall Score (%)",
        "Skills Score (%)",
        "Experience Score (%)",
        "Semantic Score (%)",
        "Education Score (%)",
        "Experience (Years)",
        "Detected Skills",
        "Match Quality",
        "AI Summary",
        "Status",
        "Uploaded At",
    ])
 
    def match_quality(score):
        if score >= 80: return "Excellent"
        if score >= 65: return "Good"
        if score >= 45: return "Average"
        return "Below Average"
 
    # Data rows
    for i, r in enumerate(resumes, 1):
        score = round(r.score or 0, 1)
        writer.writerow([
            i,
            r.candidate_name or "Unknown",
            r.candidate_email or "",
            r.candidate_phone or "",
            score,
            round(r.skills_score or 0, 1),
            round(r.experience_score or 0, 1),
            round(r.semantic_score or 0, 1),
            round(r.education_score or 0, 1),
            round(r.experience_years or 0, 1) if r.experience_years else "",
            ", ".join(r.extracted_skills or []),
            match_quality(score),
            r.summary or "",
            r.status,
            r.uploaded_at.strftime("%Y-%m-%d %H:%M") if r.uploaded_at else "",
        ])
 
    output.seek(0)
    # Safe filename
    safe_title = "".join(c if c.isalnum() or c in "-_" else "_" for c in job.title)
    filename = f"RecruitAI_Rankings_{safe_title}_Job{job_id}.csv"
 
    return StreamingResponse(
        iter([output.getvalue().encode("utf-8-sig")]),  # utf-8-sig = Excel-compatible BOM
        media_type="text/csv; charset=utf-8-sig",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        }
    )
 
 
@router.get("/candidate/{resume_id}", response_model=RankingResult)
def get_candidate_result(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Candidate not found")
 
    all_scored = (
        db.query(Resume)
        .filter(Resume.job_id == resume.job_id, Resume.score.isnot(None))
        .order_by(Resume.score.desc())
        .all()
    )
    rank = next((i + 1 for i, r in enumerate(all_scored) if r.id == resume_id), 0)
 
    return RankingResult(
        id=resume.id,
        candidate_name=resume.candidate_name,
        candidate_email=resume.candidate_email,
        score=resume.score or 0,
        skills_score=resume.skills_score,
        experience_score=resume.experience_score,
        education_score=resume.education_score,
        semantic_score=resume.semantic_score,
        extracted_skills=resume.extracted_skills or [],
        summary=resume.summary,
        rank=rank,
    )
 