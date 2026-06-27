from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import current_user
from app.db.session import get_db
from app.models.document import Document
from app.models.user import User
from app.schemas.document import DocumentCreate, DocumentRead, DocumentUpdate
from app.services.audit import audit_event
from app.services.pdf import html_to_pdf_bytes
from app.services.templates import sanitize_html


router = APIRouter(prefix="/documents", tags=["documents"])


def _owned_document(db: Session, user: User, document_id: int) -> Document:
    document = db.get(Document, document_id)
    if not document or document.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return document


@router.get("", response_model=list[DocumentRead])
def list_documents(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(select(Document).where(Document.owner_id == user.id).order_by(Document.updated_at.desc())).all()


@router.post("", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
def create_document(payload: DocumentCreate, request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    document = Document(
        owner_id=user.id,
        title=payload.title,
        category=normalize_category(payload.category),
        content_json=payload.content_json,
        content_html=sanitize_html(payload.content_html),
    )
    db.add(document)
    db.flush()
    audit_event(db, "document.create", user.id, "document", str(document.id), getattr(request.state, "request_id", None))
    db.commit()
    db.refresh(document)
    return document


@router.get("/{document_id}", response_model=DocumentRead)
def get_document(document_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return _owned_document(db, user, document_id)


@router.patch("/{document_id}", response_model=DocumentRead)
def update_document(document_id: int, payload: DocumentUpdate, request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    document = _owned_document(db, user, document_id)
    if payload.title is not None:
        document.title = payload.title
    if "category" in payload.model_fields_set:
        document.category = normalize_category(payload.category)
    if payload.content_json is not None:
        document.content_json = payload.content_json
    if payload.content_html is not None:
        document.content_html = sanitize_html(payload.content_html)
    audit_event(db, "document.update", user.id, "document", str(document.id), getattr(request.state, "request_id", None))
    db.commit()
    db.refresh(document)
    return document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: int, request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    document = _owned_document(db, user, document_id)
    audit_event(db, "document.delete", user.id, "document", str(document.id), getattr(request.state, "request_id", None))
    db.delete(document)
    db.commit()


@router.post("/{document_id}/export/pdf")
def export_document_pdf(document_id: int, request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    document = _owned_document(db, user, document_id)
    audit_event(db, "document.export_pdf", user.id, "document", str(document.id), getattr(request.state, "request_id", None))
    db.commit()
    pdf_bytes = html_to_pdf_bytes(document.title, document.content_html)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"content-disposition": f'attachment; filename="{document.title}.pdf"'},
    )


def normalize_category(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None
