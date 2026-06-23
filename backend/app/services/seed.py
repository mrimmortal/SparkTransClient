from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.macro import Macro
from app.models.template import Template
from app.models.user import User
from app.services.security import hash_password
from app.services.templates import sanitize_html


def seed_sample_user(db: Session, email: str, password: str) -> User:
    normalized_email = email.lower().strip()
    user = db.scalar(select(User).where(User.email == normalized_email))
    if not user:
        user = User(email=normalized_email, password_hash=hash_password(password))
        db.add(user)
        db.flush()
    elif not _password_matches(user.password_hash, password):
        user.password_hash = hash_password(password)

    _ensure_sample_document(db, user.id)
    _ensure_sample_template(db, user.id)
    _ensure_sample_macro(db, user.id)
    db.commit()
    db.refresh(user)
    return user


def _password_matches(password_hash: str, password: str) -> bool:
    from app.services.security import verify_password

    return verify_password(password, password_hash)


def _ensure_sample_document(db: Session, owner_id: int) -> None:
    exists = db.scalar(select(Document).where(Document.owner_id == owner_id, Document.title == "Sample dictation note"))
    if exists:
        return
    db.add(
        Document(
            owner_id=owner_id,
            title="Sample dictation note",
            content_json="{}",
            content_html=sanitize_html(
                "<p>This sample document is ready for Smart Editor testing.</p>"
                "<p>Start dictation, type manually, save, and export from here.</p>"
            ),
        )
    )


def _ensure_sample_template(db: Session, owner_id: int) -> None:
    exists = db.scalar(select(Template).where(Template.owner_id == owner_id, Template.name == "Meeting minutes"))
    if exists:
        return
    db.add(
        Template(
            owner_id=owner_id,
            name="Meeting minutes",
            content_html=sanitize_html("<h2>Meeting Minutes</h2><p>Attendees:</p><p>Notes:</p><p>Action items:</p>"),
            source_filename=None,
        )
    )


def _ensure_sample_macro(db: Session, owner_id: int) -> None:
    exists = db.scalar(select(Macro).where(Macro.owner_id == owner_id, Macro.trigger == "standard closing note"))
    if exists:
        return
    db.add(
        Macro(
            owner_id=owner_id,
            trigger="standard closing note",
            replacement="Please review the above details and confirm if any correction is required.",
            enabled=True,
        )
    )
