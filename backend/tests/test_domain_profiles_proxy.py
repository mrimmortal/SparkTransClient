from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base, get_db
from app.main import app


class FakeResponse:
    def __init__(self, status_code: int, body: dict):
        self.status_code = status_code
        self._body = body

    def json(self):
        return self._body


class FakeHttpClient:
    calls: list[tuple[str, str, dict | None]] = []

    def __init__(self, timeout: float):
        self.timeout = timeout

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback):
        return None

    def get(self, url: str):
        self.calls.append(("GET", url, None))
        return FakeResponse(200, {"domainProfiles": ["general", "medical"], "profiles": {}})

    def put(self, url: str, json: dict):
        self.calls.append(("PUT", url, json))
        return FakeResponse(200, {"profile": json, "domainProfiles": ["general", "medical"], "profiles": {"medical": json}})

    def delete(self, url: str):
        self.calls.append(("DELETE", url, None))
        return FakeResponse(200, {"domainProfiles": ["general"], "profiles": {}})


@pytest.fixture()
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, base_url="http://127.0.0.1") as test_client:
        response = test_client.post("/api/auth/register", json={"email": "profiles@example.com", "password": "StrongPassword123!"})
        assert response.status_code == 201
        yield test_client
    app.dependency_overrides.clear()


def test_domain_profiles_proxy_forwards_get_to_corestt_http_origin(monkeypatch, client: TestClient):
    from app.api import domain_profiles

    FakeHttpClient.calls = []
    monkeypatch.setattr(domain_profiles, "get_settings", lambda: SimpleNamespace(corestt_ws_url="ws://corestt.test:8020/ws/transcribe"))
    monkeypatch.setattr(domain_profiles.httpx, "Client", FakeHttpClient)

    response = client.get("/api/domain-profiles")

    assert response.status_code == 200
    assert response.json()["domainProfiles"] == ["general", "medical"]
    assert FakeHttpClient.calls == [("GET", "http://corestt.test:8020/api/domain-profiles", None)]


def test_domain_profiles_proxy_forwards_put_and_delete_with_encoded_name(monkeypatch, client: TestClient):
    from app.api import domain_profiles

    FakeHttpClient.calls = []
    monkeypatch.setattr(domain_profiles, "get_settings", lambda: SimpleNamespace(corestt_ws_url="wss://corestt.test/ws/transcribe"))
    monkeypatch.setattr(domain_profiles.httpx, "Client", FakeHttpClient)

    payload = {
        "initial_prompt": "Medical dictation.",
        "initial_prompt_realtime": None,
        "hotwords": ["hypertension"],
    }

    put_response = client.put("/api/domain-profiles/medical notes", json=payload)
    delete_response = client.delete("/api/domain-profiles/medical notes")

    assert put_response.status_code == 200
    assert delete_response.status_code == 200
    assert FakeHttpClient.calls == [
        ("PUT", "https://corestt.test/api/domain-profiles/medical%20notes", payload),
        ("DELETE", "https://corestt.test/api/domain-profiles/medical%20notes", None),
    ]
