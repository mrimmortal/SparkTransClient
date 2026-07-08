from typing import Any
from urllib.parse import quote, urlsplit, urlunsplit

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse, Response

from app.api.deps import current_user
from app.core.config import get_settings
from app.models.user import User


router = APIRouter(prefix="/domain-profiles", tags=["domain-profiles"])


def domain_profiles_base_url() -> str:
    parsed = urlsplit(get_settings().corestt_ws_url)
    if parsed.scheme == "ws":
        scheme = "http"
    elif parsed.scheme == "wss":
        scheme = "https"
    else:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Invalid CoreSTT WebSocket URL")
    return urlunsplit((scheme, parsed.netloc, "/api/domain-profiles", "", ""))


def proxy_response(response: httpx.Response) -> Response:
    try:
        content: Any = response.json()
    except ValueError:
        content = {"detail": response.text or "CoreSTT profile service returned an invalid response"}
    return JSONResponse(status_code=response.status_code, content=content)


@router.get("")
def list_domain_profiles(user: User = Depends(current_user)):
    with httpx.Client(timeout=10.0) as client:
        response = client.get(domain_profiles_base_url())
    return proxy_response(response)


@router.put("/{name:path}")
async def update_domain_profile(name: str, request: Request, user: User = Depends(current_user)):
    payload = await request.json()
    url = f"{domain_profiles_base_url()}/{quote(name, safe='')}"
    with httpx.Client(timeout=10.0) as client:
        response = client.put(url, json=payload)
    return proxy_response(response)


@router.delete("/{name:path}")
def delete_domain_profile(name: str, user: User = Depends(current_user)):
    url = f"{domain_profiles_base_url()}/{quote(name, safe='')}"
    with httpx.Client(timeout=10.0) as client:
        response = client.delete(url)
    return proxy_response(response)
