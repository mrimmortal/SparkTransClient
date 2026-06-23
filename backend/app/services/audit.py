import json
from typing import Any

from sqlalchemy.orm import Session

from app.models.audit import AuditEvent


def audit_event(
    db: Session,
    event: str,
    owner_id: int | None = None,
    resource_type: str | None = None,
    resource_id: str | None = None,
    request_id: str | None = None,
    detail: dict[str, Any] | None = None,
) -> None:
    db.add(
        AuditEvent(
            event=event,
            owner_id=owner_id,
            resource_type=resource_type,
            resource_id=resource_id,
            request_id=request_id,
            detail_json=json.dumps(detail or {}, separators=(",", ":")),
        )
    )

