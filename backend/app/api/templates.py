from fastapi import APIRouter, Depends, Request, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import current_user
from app.core.config import get_settings
from app.db.session import get_db
from app.models.template import Template
from app.models.user import User
from app.schemas.template import TemplateCreate, TemplateRead, TemplateUpdate
from app.services.audit import audit_event
from app.services.templates import extract_docx_html, fuzzy_score, sanitize_html


router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("", response_model=list[TemplateRead])
def list_templates(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(select(Template).where(Template.owner_id == user.id).order_by(Template.name)).all()


@router.post("", response_model=TemplateRead, status_code=status.HTTP_201_CREATED)
def create_template(payload: TemplateCreate, request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    template = Template(owner_id=user.id, name=payload.name, content_html=sanitize_html(payload.content_html))
    db.add(template)
    db.flush()
    audit_event(db, "template.create", user.id, "template", str(template.id), getattr(request.state, "request_id", None))
    db.commit()
    db.refresh(template)
    return template


@router.post("/upload", response_model=TemplateRead, status_code=status.HTTP_201_CREATED)
async def upload_template(file: UploadFile, request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    filename, content_html = await extract_docx_html(file, get_settings().max_upload_bytes)
    template = Template(owner_id=user.id, name=filename.rsplit(".", 1)[0], content_html=content_html, source_filename=filename)
    db.add(template)
    db.flush()
    audit_event(db, "template.upload", user.id, "template", str(template.id), getattr(request.state, "request_id", None))
    db.commit()
    db.refresh(template)
    return template


@router.get("/search", response_model=list[TemplateRead])
def search_templates(q: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    templates = db.scalars(select(Template).where(Template.owner_id == user.id)).all()
    return [item for score, item in sorted(((fuzzy_score(q, template.name), template) for template in templates), key=lambda pair: pair[0], reverse=True) if score >= 0.45][:10]


@router.patch("/{template_id}", response_model=TemplateRead)
def update_template(template_id: int, payload: TemplateUpdate, request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    template = db.get(Template, template_id)
    if not template or template.owner_id != user.id:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Template not found")
    if payload.name is not None:
        template.name = payload.name
    if payload.content_html is not None:
        template.content_html = sanitize_html(payload.content_html)
    audit_event(db, "template.update", user.id, "template", str(template.id), getattr(request.state, "request_id", None))
    db.commit()
    db.refresh(template)
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(template_id: int, request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    template = db.get(Template, template_id)
    if template and template.owner_id == user.id:
        audit_event(db, "template.delete", user.id, "template", str(template.id), getattr(request.state, "request_id", None))
        db.delete(template)
        db.commit()

