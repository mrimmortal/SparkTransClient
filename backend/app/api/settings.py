from fastapi import APIRouter, Depends
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.api.deps import current_user
from app.db.session import get_db
from app.models.settings import ShortcutBinding, UserSettings
from app.models.user import User
from app.schemas.settings import ShortcutBindingRead, ShortcutBindingWrite, UserSettingsRead, UserSettingsUpdate


router = APIRouter(tags=["settings"])


def _settings(db: Session, user: User) -> UserSettings:
    settings = db.scalar(select(UserSettings).where(UserSettings.owner_id == user.id))
    if settings:
        return settings
    settings = UserSettings(owner_id=user.id)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


@router.get("/settings", response_model=UserSettingsRead)
def get_settings(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return _settings(db, user)


@router.patch("/settings", response_model=UserSettingsRead)
def update_settings(payload: UserSettingsUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    settings = _settings(db, user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    db.commit()
    db.refresh(settings)
    return settings


@router.get("/shortcuts", response_model=list[ShortcutBindingRead])
def list_shortcuts(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(select(ShortcutBinding).where(ShortcutBinding.owner_id == user.id).order_by(ShortcutBinding.action)).all()


@router.put("/shortcuts", response_model=list[ShortcutBindingRead])
def replace_shortcuts(payload: list[ShortcutBindingWrite], user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.execute(delete(ShortcutBinding).where(ShortcutBinding.owner_id == user.id))
    for item in payload:
        db.add(ShortcutBinding(owner_id=user.id, **item.model_dump()))
    db.commit()
    return db.scalars(select(ShortcutBinding).where(ShortcutBinding.owner_id == user.id).order_by(ShortcutBinding.action)).all()

