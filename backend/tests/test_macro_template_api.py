from io import BytesIO

import pytest
from docx import Document as DocxDocument
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from app.db.session import Base, get_db
from app.main import app


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
        yield test_client
    app.dependency_overrides.clear()


def register(client: TestClient, email: str) -> None:
    response = client.post("/api/auth/register", json={"email": email, "password": "StrongPassword123!"})
    assert response.status_code == 201


def test_macro_crud_and_owner_isolation(client: TestClient):
    register(client, "owner@example.com")

    created = client.post("/api/macros", json={"trigger": " standard closing note ", "replacement": "Please review.", "enabled": True})
    assert created.status_code == 201
    macro = created.json()
    assert macro["trigger"] == " standard closing note "

    updated = client.patch(f"/api/macros/{macro['id']}", json={"trigger": "standard closing note", "enabled": False})
    assert updated.status_code == 200
    assert updated.json()["enabled"] is False

    assert client.get("/api/macros").json()[0]["trigger"] == "standard closing note"

    client.post("/api/auth/logout")
    register(client, "other@example.com")

    assert client.get("/api/macros").json() == []
    hidden_update = client.patch(f"/api/macros/{macro['id']}", json={"enabled": True})
    assert hidden_update.status_code == 404


def test_template_crud_search_sanitization_and_owner_isolation(client: TestClient):
    register(client, "template-owner@example.com")

    created = client.post(
        "/api/templates",
        json={
            "name": "Meeting minutes",
            "category": "Clinical",
            "content_html": "<p>Agenda</p><script>alert('x')</script><p onclick='x()'>Notes</p>",
        },
    )
    assert created.status_code == 201
    template = created.json()
    assert template["category"] == "Clinical"
    assert "<script" not in template["content_html"]
    assert "onclick" not in template["content_html"]

    search = client.get("/api/templates/search", params={"q": "meeting"})
    assert search.status_code == 200
    assert [item["id"] for item in search.json()] == [template["id"]]

    category_search = client.get("/api/templates/search", params={"q": "clinical"})
    assert category_search.status_code == 200
    assert [item["id"] for item in category_search.json()] == [template["id"]]

    updated = client.patch(f"/api/templates/{template['id']}", json={"name": "Updated meeting", "category": "Follow-up"})
    assert updated.status_code == 200
    assert updated.json()["name"] == "Updated meeting"
    assert updated.json()["category"] == "Follow-up"

    client.post("/api/auth/logout")
    register(client, "template-other@example.com")

    assert client.get("/api/templates").json() == []
    hidden_update = client.patch(f"/api/templates/{template['id']}", json={"name": "Hidden"})
    assert hidden_update.status_code == 404


def test_template_docx_upload_and_invalid_upload_rejection(client: TestClient):
    register(client, "upload@example.com")
    doc = DocxDocument()
    doc.add_paragraph("Uploaded paragraph")
    docx_bytes = BytesIO()
    doc.save(docx_bytes)
    docx_bytes.seek(0)

    uploaded = client.post(
        "/api/templates/upload",
        files={"file": ("Uploaded.docx", docx_bytes.getvalue(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    assert uploaded.status_code == 201
    assert uploaded.json()["name"] == "Uploaded"
    assert uploaded.json()["category"] is None
    assert uploaded.json()["content_html"] == "<p>Uploaded paragraph</p>"

    invalid = client.post("/api/templates/upload", files={"file": ("bad.txt", b"not a docx", "text/plain")})
    assert invalid.status_code == 400
    assert invalid.json()["detail"] == "Only .docx templates are supported"


def test_user_settings_defaults_and_update(client: TestClient):
    register(client, "settings@example.com")

    defaults = client.get("/api/settings")
    assert defaults.status_code == 200
    body = defaults.json()
    assert body["auto_connect_corestt"] is False
    assert body["autosave_enabled"] is False
    assert body["autosave_interval_seconds"] == 30
    assert body["confirm_destructive_actions"] is True
    assert body["duplicate_transcript_protection_enabled"] is True
    assert body["duplicate_transcript_window_ms"] == 5000
    assert body["ignore_blank_audio_enabled"] is True
    assert body["voice_command_variants_enabled"] is True
    assert body["default_template_id"] is None
    assert body["show_microphone_status"] is True
    assert body["template_marker_navigation_enabled"] is False
    assert body["template_marker_auto_advance_enabled"] is False

    updated = client.patch(
        "/api/settings",
        json={
            "audio_device_id": "device-1",
            "voice_commands_enabled": False,
            "macros_enabled": False,
            "default_editor_target": "micro-editor",
            "profile": "meeting-notes",
            "auto_connect_corestt": True,
            "autosave_enabled": True,
            "autosave_interval_seconds": 15,
            "confirm_destructive_actions": False,
            "duplicate_transcript_protection_enabled": False,
            "duplicate_transcript_window_ms": 2500,
            "ignore_blank_audio_enabled": False,
            "voice_command_variants_enabled": False,
            "default_template_id": 42,
            "show_microphone_status": False,
            "template_marker_navigation_enabled": True,
            "template_marker_auto_advance_enabled": True,
        },
    )

    assert updated.status_code == 200
    updated_body = updated.json()
    assert updated_body["audio_device_id"] == "device-1"
    assert updated_body["voice_commands_enabled"] is False
    assert updated_body["macros_enabled"] is False
    assert updated_body["default_editor_target"] == "micro-editor"
    assert updated_body["profile"] == "meeting-notes"
    assert updated_body["auto_connect_corestt"] is True
    assert updated_body["autosave_enabled"] is True
    assert updated_body["autosave_interval_seconds"] == 15
    assert updated_body["confirm_destructive_actions"] is False
    assert updated_body["duplicate_transcript_protection_enabled"] is False
    assert updated_body["duplicate_transcript_window_ms"] == 2500
    assert updated_body["ignore_blank_audio_enabled"] is False
    assert updated_body["voice_command_variants_enabled"] is False
    assert updated_body["default_template_id"] == 42
    assert updated_body["show_microphone_status"] is False
    assert updated_body["template_marker_navigation_enabled"] is True
    assert updated_body["template_marker_auto_advance_enabled"] is True

    refreshed = client.get("/api/settings")
    assert refreshed.status_code == 200
    assert refreshed.json() == updated_body
