from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class MacroCreate(BaseModel):
    trigger: str = Field(min_length=1, max_length=255)
    replacement: str = Field(min_length=1)
    enabled: bool = True


class MacroUpdate(BaseModel):
    trigger: str | None = Field(default=None, min_length=1, max_length=255)
    replacement: str | None = Field(default=None, min_length=1)
    enabled: bool | None = None


class MacroRead(ORMModel):
    id: int
    trigger: str
    replacement: str
    enabled: bool

