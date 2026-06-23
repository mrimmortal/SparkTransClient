import asyncio
import json
import time
import uuid

import websockets
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from app.core.config import get_settings
from app.core.logging import logger


router = APIRouter(tags=["stt"])


def log_stt_proxy_event(event: str, **fields: object) -> None:
    logger.info(json.dumps({"event": event, **fields}))


@router.websocket("/ws/stt-proxy")
async def stt_proxy(websocket: WebSocket):
    session_id = str(uuid.uuid4())
    started = time.perf_counter()
    client_text_frames = 0
    client_binary_frames = 0
    corestt_text_frames = 0
    corestt_binary_frames = 0
    origin = websocket.headers.get("origin")
    settings = get_settings()
    if origin and settings.cors_origins and origin not in settings.cors_origins:
        log_stt_proxy_event("stt_proxy_rejected", session_id=session_id, reason="origin_not_allowed")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    log_stt_proxy_event("stt_proxy_connect", session_id=session_id)
    try:
        async with websockets.connect(settings.corestt_ws_url, max_size=settings.max_audio_packet_bytes + 65536) as upstream:
            log_stt_proxy_event("stt_proxy_upstream_connect", session_id=session_id)

            async def client_to_corestt():
                nonlocal client_binary_frames, client_text_frames
                while True:
                    message = await websocket.receive()
                    if message["type"] == "websocket.disconnect":
                        await upstream.close()
                        return
                    if "bytes" in message and message["bytes"] is not None:
                        payload = message["bytes"]
                        client_binary_frames += 1
                        log_stt_proxy_event(
                            "stt_proxy_client_frame",
                            session_id=session_id,
                            frame_type="binary",
                            bytes=len(payload),
                        )
                        await upstream.send(payload)
                    elif "text" in message and message["text"] is not None:
                        payload = message["text"]
                        client_text_frames += 1
                        log_stt_proxy_event(
                            "stt_proxy_client_frame",
                            session_id=session_id,
                            frame_type="text",
                            bytes=len(payload.encode("utf-8")),
                        )
                        await upstream.send(payload)

            async def corestt_to_client():
                nonlocal corestt_binary_frames, corestt_text_frames
                async for message in upstream:
                    if isinstance(message, bytes):
                        corestt_binary_frames += 1
                        log_stt_proxy_event(
                            "stt_proxy_corestt_frame",
                            session_id=session_id,
                            frame_type="binary",
                            bytes=len(message),
                        )
                        await websocket.send_bytes(message)
                    else:
                        corestt_text_frames += 1
                        log_stt_proxy_event(
                            "stt_proxy_corestt_frame",
                            session_id=session_id,
                            frame_type="text",
                            bytes=len(message.encode("utf-8")),
                        )
                        await websocket.send_text(message)

            await asyncio.gather(client_to_corestt(), corestt_to_client())
    except WebSocketDisconnect:
        return
    except Exception as exc:
        logger.exception(json.dumps({"event": "stt_proxy_error", "session_id": session_id, "error": exc.__class__.__name__}))
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
    finally:
        duration_ms = round((time.perf_counter() - started) * 1000, 2)
        log_stt_proxy_event(
            "stt_proxy_disconnect",
            session_id=session_id,
            duration_ms=duration_ms,
            client_text_frames=client_text_frames,
            client_binary_frames=client_binary_frames,
            corestt_text_frames=corestt_text_frames,
            corestt_binary_frames=corestt_binary_frames,
        )
