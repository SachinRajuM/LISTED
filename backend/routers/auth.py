from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
 
from database import get_db, User, UserRole
from schemas import UserRegister, UserLogin, TokenResponse, UserOut
from auth import hash_password, verify_password, create_access_token, get_current_user
from limiter import limiter           # ← from limiter.py, not main
 
router = APIRouter(prefix="/auth", tags=["auth"])
 
 
@router.post("/register", response_model=TokenResponse, status_code=201)
@limiter.limit("5/minute")
def register(request: Request, data: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
 
    valid_roles = {r.value for r in UserRole}
    role = data.role if data.role in valid_roles else UserRole.end_user.value
 
    user = User(
        full_name=data.full_name,
        email=data.email,
        hashed_password=hash_password(data.password),
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
 
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))
 
 
@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email, User.is_active == True).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))
 
 
@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
 
 
@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}
 