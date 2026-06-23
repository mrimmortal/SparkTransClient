from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.db.session import Base
from app.models.document import Document
from app.models.macro import Macro
from app.models.template import Template
from app.models.user import User
from app.services.seed import seed_sample_user
from app.services.security import verify_password


def test_seed_sample_user_creates_user_and_starter_content():
    engine = create_engine("sqlite:///:memory:")
    TestingSession = sessionmaker(bind=engine)
    Base.metadata.create_all(bind=engine)

    with TestingSession() as db:
        user = seed_sample_user(db, email="sample@example.com", password="sample-password-123")

        stored_user = db.scalar(select(User).where(User.email == "sample@example.com"))
        documents = db.scalars(select(Document).where(Document.owner_id == user.id)).all()
        templates = db.scalars(select(Template).where(Template.owner_id == user.id)).all()
        macros = db.scalars(select(Macro).where(Macro.owner_id == user.id)).all()

    assert stored_user is not None
    assert verify_password("sample-password-123", stored_user.password_hash)
    assert [document.title for document in documents] == ["Sample dictation note"]
    assert [template.name for template in templates] == ["Meeting minutes"]
    assert [macro.trigger for macro in macros] == ["standard closing note"]


def test_seed_sample_user_is_idempotent():
    engine = create_engine("sqlite:///:memory:")
    TestingSession = sessionmaker(bind=engine)
    Base.metadata.create_all(bind=engine)

    with TestingSession() as db:
        first = seed_sample_user(db, email="sample@example.com", password="sample-password-123")
        second = seed_sample_user(db, email="sample@example.com", password="sample-password-123")
        users = db.scalars(select(User)).all()

    assert first.id == second.id
    assert len(users) == 1


def test_seed_sample_user_repairs_existing_sample_password():
    engine = create_engine("sqlite:///:memory:")
    TestingSession = sessionmaker(bind=engine)
    Base.metadata.create_all(bind=engine)

    with TestingSession() as db:
        db.add(User(email="sample@example.com", password_hash="legacy-or-invalid-hash"))
        db.commit()

        seed_sample_user(db, email="sample@example.com", password="sample-password-123")
        stored_user = db.scalar(select(User).where(User.email == "sample@example.com"))

    assert stored_user is not None
    assert verify_password("sample-password-123", stored_user.password_hash)
