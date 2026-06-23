from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import current_user
from app.db.session import get_db
from app.models.macro import Macro
from app.models.user import User
from app.schemas.macro import MacroCreate, MacroRead, MacroUpdate
from app.services.audit import audit_event


router = APIRouter(prefix="/macros", tags=["macros"])


@router.get("", response_model=list[MacroRead])
def list_macros(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(select(Macro).where(Macro.owner_id == user.id).order_by(Macro.trigger)).all()


@router.post("", response_model=MacroRead, status_code=status.HTTP_201_CREATED)
def create_macro(payload: MacroCreate, request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    macro = Macro(owner_id=user.id, trigger=payload.trigger, replacement=payload.replacement, enabled=payload.enabled)
    db.add(macro)
    db.flush()
    audit_event(db, "macro.create", user.id, "macro", str(macro.id), getattr(request.state, "request_id", None))
    db.commit()
    db.refresh(macro)
    return macro


@router.patch("/{macro_id}", response_model=MacroRead)
def update_macro(macro_id: int, payload: MacroUpdate, request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    macro = db.get(Macro, macro_id)
    if not macro or macro.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Macro not found")
    for field in ("trigger", "replacement", "enabled"):
        value = getattr(payload, field)
        if value is not None:
            setattr(macro, field, value)
    audit_event(db, "macro.update", user.id, "macro", str(macro.id), getattr(request.state, "request_id", None))
    db.commit()
    db.refresh(macro)
    return macro


@router.delete("/{macro_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_macro(macro_id: int, request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    macro = db.get(Macro, macro_id)
    if macro and macro.owner_id == user.id:
        audit_event(db, "macro.delete", user.id, "macro", str(macro.id), getattr(request.state, "request_id", None))
        db.delete(macro)
        db.commit()

