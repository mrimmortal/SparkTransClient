from datetime import timedelta

from fastapi import HTTPException, Request, Response, status
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError, VerificationError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.user import User


password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return password_hasher.verify(password_hash, password)
    except (InvalidHashError, VerifyMismatchError, VerificationError):
        return False


def _serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(get_settings().secret_key, salt="sparktrans-session")


def create_session_cookie(response: Response, user: User) -> None:
    settings = get_settings()
    token = _serializer().dumps({"sub": user.id})
    response.set_cookie(
        settings.cookie_name,
        token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=int(timedelta(days=7).total_seconds()),
    )


def clear_session_cookie(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(settings.cookie_name)


def get_user_from_request(request: Request, db: Session) -> User:
    settings = get_settings()
    token = request.cookies.get(settings.cookie_name)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    try:
        data = _serializer().loads(token, max_age=int(timedelta(days=7).total_seconds()))
    except (BadSignature, SignatureExpired):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session") from None
    user = db.get(User, int(data["sub"]))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
    return user
