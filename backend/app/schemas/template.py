from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class TemplateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    category: str | None = Field(default=None, max_length=255)
    content_html: str = ""


class TemplateUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    category: str | None = Field(default=None, max_length=255)
    content_html: str | None = None


class TemplateRead(ORMModel):
    id: int
    name: str
    category: str | None
    content_html: str
    source_filename: str | None
    created_at: datetime
