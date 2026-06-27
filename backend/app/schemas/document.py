from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class DocumentCreate(BaseModel):
    title: str = Field(default="Untitled", min_length=1, max_length=255)
    category: str | None = Field(default=None, max_length=255)
    content_json: str = "{}"
    content_html: str = ""


class DocumentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    category: str | None = Field(default=None, max_length=255)
    content_json: str | None = None
    content_html: str | None = None


class DocumentRead(ORMModel):
    id: int
    title: str
    category: str | None
    content_json: str
    content_html: str
    created_at: datetime
    updated_at: datetime
