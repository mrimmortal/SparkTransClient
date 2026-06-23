from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, UserRead
from app.schemas.common import Message
from app.services.audit import audit_event
from app.services.security import clear_session_cookie, create_session_cookie, hash_password, verify_password


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    existing = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(email=payload.email.lower(), password_hash=hash_password(payload.password))
    db.add(user)
    db.flush()
    audit_event(db, "auth.register", owner_id=user.id, request_id=getattr(request.state, "request_id", None))
    db.commit()
    db.refresh(user)
    create_session_cookie(response, user)
    return user


@router.post("/login", response_model=UserRead)
def login(payload: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        audit_event(db, "auth.login_failed", request_id=getattr(request.state, "request_id", None), detail={"email": payload.email.lower()})
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    audit_event(db, "auth.login_success", owner_id=user.id, request_id=getattr(request.state, "request_id", None))
    db.commit()
    create_session_cookie(response, user)
    return user


@router.post("/logout", response_model=Message)
def logout(response: Response, user: User = Depends(current_user), db: Session = Depends(get_db)):
    audit_event(db, "auth.logout", owner_id=user.id)
    db.commit()
    clear_session_cookie(response)
    return Message(message="Logged out")


@router.get("/me", response_model=UserRead)
def me(user: User = Depends(current_user)):
    return user

