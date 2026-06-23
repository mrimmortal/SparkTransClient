from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.services.security import get_user_from_request


def current_user(request: Request, db: Session = Depends(get_db)) -> User:
    return get_user_from_request(request, db)

