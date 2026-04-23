from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
 
from database import get_db, User, Job, Resume, UserRole
from schemas import AdminOverview, UserOut, UpdateRole
from auth import require_admin
 
router = APIRouter(prefix="/admin", tags=["admin"])
 
 
@router.get("/overview", response_model=AdminOverview)
def overview(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return AdminOverview(
        total_users=db.query(func.count(User.id)).scalar(),
        total_jobs=db.query(func.count(Job.id)).scalar(),
        total_resumes=db.query(func.count(Resume.id)).scalar(),
        total_rankings=db.query(func.count(Resume.id)).filter(Resume.score.isnot(None)).scalar(),
    )
 
 
@router.get("/users")
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [UserOut.model_validate(u) for u in users]
 
 
@router.put("/users/{user_id}/role")
def update_role(
    user_id: int,
    data: UpdateRole,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    valid = {r.value for r in UserRole}
    if data.role not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid}")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = data.role
    db.commit()
    return UserOut.model_validate(user)
 
 
@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
 