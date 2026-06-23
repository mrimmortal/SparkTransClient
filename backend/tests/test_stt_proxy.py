import asyncio
import json
import logging
import time
from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.api import stt_proxy
from app.main import app


class FakeCoreSttConnection:
    def __init__(self) -> None:
        self.sent: list[str | bytes] = []
        self.incoming: asyncio.Queue[str | bytes | None] = asyncio.Queue()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, traceback):
        await self.close()

    def __aiter__(self):
        return self

    async def __anext__(self):
        message = await self.incoming.get()
        if message is None:
            raise StopAsyncIteration
        return message

    async def send(self, message: str | bytes) -> None:
        self.sent.append(message)

    async def close(self) -> None:
        await self.incoming.put(None)


def test_stt_proxy_relays_text_and_binary_frames_both_directions(monkeypatch):
    upstream = FakeCoreSttConnection()

    def fake_connect(url: str, max_size: int):
        assert url == "ws://corestt.test/ws/transcribe"
        assert max_size == 512 * 1024 + 65536
        return upstream

    monkeypatch.setattr(stt_proxy.websockets, "connect", fake_connect)
    monkeypatch.setattr(
        stt_proxy,
        "get_settings",
        lambda: SimpleNamespace(
            cors_origins=[],
            corestt_ws_url="ws://corestt.test/ws/transcribe",
            max_audio_packet_bytes=512 * 1024,
        ),
    )

    with TestClient(app, base_url="http://127.0.0.1") as client:
        with client.websocket_connect("/ws/stt-proxy", headers={"host": "127.0.0.1"}) as websocket:
            upstream.incoming.put_nowait('{"type":"ready"}')
            assert websocket.receive_text() == '{"type":"ready"}'

            upstream.incoming.put_nowait(b"\x01\x02")
            assert websocket.receive_bytes() == b"\x01\x02"

            websocket.send_text('{"type":"start"}')
            websocket.send_bytes(b"\x03\x04")

            deadline = time.monotonic() + 1
            while len(upstream.sent) < 2 and time.monotonic() < deadline:
                time.sleep(0.01)

            assert upstream.sent == ['{"type":"start"}', b"\x03\x04"]


def test_stt_proxy_logs_lifecycle_and_frame_counts(monkeypatch, caplog):
    upstream = FakeCoreSttConnection()

    def fake_connect(url: str, max_size: int):
        return upstream

    monkeypatch.setattr(stt_proxy.websockets, "connect", fake_connect)
    monkeypatch.setattr(
        stt_proxy,
        "get_settings",
        lambda: SimpleNamespace(
            cors_origins=[],
            corestt_ws_url="ws://corestt.test/ws/transcribe",
            max_audio_packet_bytes=512 * 1024,
        ),
    )

    caplog.set_level(logging.INFO, logger="sparktrans")

    with TestClient(app, base_url="http://127.0.0.1") as client:
        with client.websocket_connect("/ws/stt-proxy", headers={"host": "127.0.0.1"}) as websocket:
            upstream.incoming.put_nowait('{"type":"ready"}')
            assert websocket.receive_text() == '{"type":"ready"}'
            websocket.send_text('{"type":"start"}')

            deadline = time.monotonic() + 1
            while len(upstream.sent) < 1 and time.monotonic() < deadline:
                time.sleep(0.01)

    events = [json.loads(record.message) for record in caplog.records if record.name == "sparktrans"]

    assert any(event["event"] == "stt_proxy_connect" for event in events)
    assert any(
        event["event"] == "stt_proxy_client_frame"
        and event["frame_type"] == "text"
        and "payload" not in event
        for event in events
    )
    assert any(
        event["event"] == "stt_proxy_corestt_frame"
        and event["frame_type"] == "text"
        and "payload" not in event
        for event in events
    )
    assert any(event["event"] == "stt_proxy_disconnect" for event in events)
