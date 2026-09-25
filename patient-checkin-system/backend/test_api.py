import base64
import os
import tempfile
from datetime import date, timedelta

# Use a throwaway database and fixed key so tests never touch real data.
_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(_tmp, 'test.db')}"
os.environ["KIOSK_SECRET_KEY"] = "test-secret"

import cv2  # noqa: E402
import numpy as np  # noqa: E402
import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import config  # noqa: E402
import face_engine  # noqa: E402
import main  # noqa: E402

config.IMAGES_DIR = os.path.join(_tmp, "images")


# --- Fake face model: an image's colour decides "who" it is -------------------------------
def fake_embed(img):
    b, g, r = img[0, 0].astype(float)
    if (b, g, r) == (0, 0, 0):
        raise face_engine.FaceError("no_face")
    v = np.array([b, g, r, 1.0])
    return (v / np.linalg.norm(v)).tolist()


def image(color):
    img = np.zeros((120, 120, 3), dtype=np.uint8)
    img[:] = color
    ok, buf = cv2.imencode(".jpg", img)
    return "data:image/jpeg;base64," + base64.b64encode(buf.tobytes()).decode()


ALICE_FACE = (250, 10, 10)
BOB_FACE = (10, 10, 250)
NO_FACE = (0, 0, 0)
SIGNATURE = "data:image/png;base64,iVBORw0KGgo="


@pytest.fixture(scope="module")
def client():
    main._background_start = lambda: face_engine._state.update(status="ready")
    face_engine.embed = fake_embed
    with TestClient(main.app) as c:
        yield c


def register(client, first="Alice", last="Smith", dob="1990-05-17", phone="(555) 010-1234",
             face=ALICE_FACE, consent=True):
    return client.post("/api/v1/kiosk/register", json={
        "first_name": first, "last_name": last, "dob": dob, "phone": phone, "email": "a@example.com",
        "address": "1 Main St", "insurance": {"provider": "Aetna", "policy": "P1", "group": "G1"},
        "face_consent": consent, "face_image": image(face) if face else None})


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def next_open_day():
    d = date.fromisoformat(main.clinic_today()) + timedelta(days=1)
    while d.weekday() not in config.OPEN_WEEKDAYS:
        d += timedelta(days=1)
    return d.isoformat()


def staff_token(client):
    r = client.post("/api/v1/staff/login", json={"username": "admin", "password": "password123"})
    token = r.json()["token"]
    if r.json()["must_change_password"]:
        assert client.post("/api/v1/staff/change-password", headers=auth(token),
                           json={"current_password": "password123", "new_password": "S3cure-pass!"}).status_code == 200
    return token


# --- Tests ---------------------------------------------------------------------------------
def test_health_and_config(client):
    assert client.get("/api/v1/health").json()["status"] == "online"
    cfg = client.get("/api/v1/kiosk/config").json()
    assert cfg["departments"] and cfg["forms"] and cfg["time_slots"]


def test_register_and_recognise_face(client):
    r = register(client)
    assert r.status_code == 200 and r.json()["face_saved"] is True
    pid = r.json()["patient"]["id"]
    m = client.post("/api/v1/kiosk/identify", json={"image": image(ALICE_FACE)}).json()
    assert m["status"] == "match" and m["patient"]["id"] == pid
    assert m["patient"] == {"id": pid, "first_name": "Alice", "last_initial": "S"}  # no extra PHI


def test_identify_no_match_and_no_face(client):
    assert client.post("/api/v1/kiosk/identify", json={"image": image(BOB_FACE)}).json()["status"] == "no_match"
    assert client.post("/api/v1/kiosk/identify", json={"image": image(NO_FACE)}).json()["status"] == "no_face"
    assert client.post("/api/v1/kiosk/identify", json={"image": "not-an-image"}).status_code == 400


def test_duplicate_registration_rejected(client):
    assert register(client).status_code == 409


def test_register_without_consent_stores_no_face(client):
    r = register(client, first="Bob", last="Jones", phone="5550109999", face=BOB_FACE, consent=False)
    assert r.status_code == 200 and r.json()["face_saved"] is False
    assert client.post("/api/v1/kiosk/identify", json={"image": image(BOB_FACE)}).json()["status"] == "no_match"


def test_register_validation(client):
    r = client.post("/api/v1/kiosk/register", json={
        "first_name": "X1", "last_name": "Y", "dob": "2999-01-01", "phone": "12", "address": "1 Main St"})
    assert r.status_code == 422


def test_lookup(client):
    ok = client.post("/api/v1/kiosk/lookup", json={"last_name": "smith", "dob": "1990-05-17", "phone_last4": "1234"})
    assert ok.status_code == 200 and ok.json()["patient"]["first_name"] == "Alice"
    bad = client.post("/api/v1/kiosk/lookup", json={"last_name": "smith", "dob": "1990-05-17", "phone_last4": "0000"})
    assert bad.status_code == 404


def test_kiosk_token_required_and_scoped(client):
    assert client.get("/api/v1/kiosk/me").status_code == 401
    assert client.get("/api/v1/kiosk/me", headers=auth("forged.token")).status_code == 401
    staff = staff_token(client)
    assert client.get("/api/v1/kiosk/me", headers=auth(staff)).status_code == 401  # staff token isn't a kiosk token


def test_booking_rules_and_conflicts(client):
    tok = register(client, first="Carol", last="King", phone="5550102222", face=None, consent=False).json()["token"]
    day = next_open_day()
    appt = {"department": "Cardiology", "physician": "Dr. Emily Rodriguez", "date": day, "time": "09:00",
            "reason": "Follow-up"}
    r = client.post("/api/v1/kiosk/appointments", headers=auth(tok), json=appt)
    assert r.status_code == 200 and r.json()["appointment"]["room"]
    # Same physician & slot is now taken, and shows as taken
    other = register(client, first="Dan", last="Lee", phone="5550103333", face=None, consent=False).json()["token"]
    assert client.post("/api/v1/kiosk/appointments", headers=auth(other), json=appt).json()["detail"] == "slot_taken"
    slots = client.get("/api/v1/kiosk/availability", headers=auth(other),
                       params={"department": "Cardiology", "physician": "Dr. Emily Rodriguez", "date": day}).json()
    assert {"time": "09:00", "state": "taken"} in slots["slots"]
    # Invalid physician / past date / out-of-list time
    assert client.post("/api/v1/kiosk/appointments", headers=auth(tok),
                       json={**appt, "physician": "Dr. Nobody"}).status_code == 400
    assert client.post("/api/v1/kiosk/appointments", headers=auth(tok),
                       json={**appt, "date": "2000-01-03"}).status_code == 409
    assert client.post("/api/v1/kiosk/appointments", headers=auth(tok),
                       json={**appt, "time": "03:00"}).status_code == 400
    # Future appointment shows as upcoming and can't be checked in yet
    me = client.get("/api/v1/kiosk/me", headers=auth(tok)).json()
    assert me["upcoming"][0]["date"] == day and me["today"] == []
    apt_id = me["upcoming"][0]["id"]
    assert client.post("/api/v1/kiosk/checkin", headers=auth(tok), json={"appointment_id": apt_id}).json()["detail"] == "not_today"
    # Patient can cancel it, freeing the slot
    assert client.post(f"/api/v1/kiosk/appointments/{apt_id}/cancel", headers=auth(tok)).status_code == 200
    assert client.post("/api/v1/kiosk/appointments", headers=auth(other), json=appt).status_code == 200


def test_checkin_today_requires_forms(client):
    tok = client.post("/api/v1/kiosk/identify", json={"image": image(ALICE_FACE)}).json()["token"]
    today = main.clinic_today()
    # Staff-side insert of a same-day appointment (kiosk booking may be past closing time)
    db = main.SessionLocal()
    pid = client.get("/api/v1/kiosk/me", headers=auth(tok)).json()["patient"]["id"]
    db.add(main.AppointmentDB(id="APT-TODAY1", patient_id=pid, patient_name="Alice Smith", department="Cardiology",
                              physician="Dr. James Anderson", date=today, time="23:59", reason="x",
                              room_number="202", status="scheduled", created_at=today))
    db.commit()
    db.close()
    me = client.get("/api/v1/kiosk/me", headers=auth(tok)).json()
    assert me["today"][0]["id"] == "APT-TODAY1" and set(me["pending_forms"]) == {"hipaa", "treatment", "financial"}
    assert client.post("/api/v1/kiosk/checkin", headers=auth(tok),
                       json={"appointment_id": "APT-TODAY1"}).json()["detail"] == "forms_required"
    r = client.post("/api/v1/kiosk/forms", headers=auth(tok), json={"signatures": [
        {"form_id": f, "signature": SIGNATURE} for f in me["pending_forms"]]})
    assert r.json()["pending_forms"] == []
    r = client.post("/api/v1/kiosk/checkin", headers=auth(tok), json={"appointment_id": "APT-TODAY1"})
    assert r.status_code == 200 and r.json()["routing"]["room"] == "202"
    assert r.json()["routing"]["patients_ahead"] == 0
    # Checking in twice is harmless
    assert client.post("/api/v1/kiosk/checkin", headers=auth(tok),
                       json={"appointment_id": "APT-TODAY1"}).json()["status"] == "already_checked_in"
    # Another patient can't check in someone else's appointment
    other = client.post("/api/v1/kiosk/lookup", json={"last_name": "King", "dob": "1990-05-17", "phone_last4": "2222"}).json()["token"]
    assert client.post("/api/v1/kiosk/checkin", headers=auth(other), json={"appointment_id": "APT-TODAY1"}).status_code == 404


def test_staff_endpoints_require_login(client):
    for method, path in [("get", "/api/v1/staff/patients"), ("get", "/api/v1/staff/appointments"),
                         ("get", "/api/v1/staff/audit"), ("post", "/api/v1/staff/reset-demo")]:
        assert getattr(client, method)(path).status_code == 401


def test_staff_login_lockout(client):
    for _ in range(5):
        assert client.post("/api/v1/staff/login", json={"username": "ghost", "password": "x"}).status_code == 401
    assert client.post("/api/v1/staff/login", json={"username": "ghost", "password": "x"}).status_code == 429


def test_default_password_must_be_changed(client):
    # A fresh admin must change the default password before using the dashboard.
    db = main.SessionLocal()
    admin = db.query(main.StaffDB).filter_by(username="admin").first()
    admin.password, admin.must_change_password = main.hash_password("password123"), True
    db.commit()
    db.close()
    tok = client.post("/api/v1/staff/login", json={"username": "admin", "password": "password123"}).json()
    assert tok["must_change_password"] is True
    assert client.get("/api/v1/staff/patients", headers=auth(tok["token"])).json()["detail"] == "password_change_required"
    assert client.post("/api/v1/staff/change-password", headers=auth(tok["token"]),
                       json={"current_password": "password123", "new_password": "password123"}).status_code == 400
    assert client.post("/api/v1/staff/change-password", headers=auth(tok["token"]),
                       json={"current_password": "password123", "new_password": "S3cure-pass!"}).status_code == 200
    assert client.get("/api/v1/staff/patients", headers=auth(tok["token"])).status_code == 200


def test_staff_dashboard_flow(client):
    tok = client.post("/api/v1/staff/login", json={"username": "admin", "password": "S3cure-pass!"}).json()["token"]
    summary = client.get("/api/v1/staff/summary", headers=auth(tok)).json()
    assert summary["counts"]["arrived"] == 1 and summary["waiting"][0]["id"] == "APT-TODAY1"
    r = client.patch("/api/v1/staff/appointments/APT-TODAY1", headers=auth(tok), json={"status": "completed"})
    assert r.json()["status"] == "completed"
    patients = client.get("/api/v1/staff/patients", headers=auth(tok), params={"q": "alice"}).json()
    assert len(patients) == 1 and patients[0]["has_face"] and "face_embedding" not in patients[0]
    pid = patients[0]["id"]
    assert client.get(f"/api/v1/staff/patients/{pid}/photo", headers=auth(tok)).status_code == 200
    assert client.get(f"/api/v1/staff/patients/{pid}/photo").status_code == 401
    assert client.get(f"/api/v1/staff/patients/{pid}/record", headers=auth(tok)).json()["appointments"]
    # Deleting face data stops face recognition for that patient
    assert client.delete(f"/api/v1/staff/patients/{pid}/face", headers=auth(tok)).status_code == 200
    assert client.post("/api/v1/kiosk/identify", json={"image": image(ALICE_FACE)}).json()["status"] == "no_match"
    actions = {e["action"] for e in client.get("/api/v1/staff/audit", headers=auth(tok)).json()}
    assert {"REGISTER", "FACE_MATCH", "CHECK_IN", "STATUS_CHANGE", "FACE_DATA_DELETED"} <= actions


def test_demo_reset(client):
    tok = client.post("/api/v1/staff/login", json={"username": "admin", "password": "S3cure-pass!"}).json()["token"]
    assert client.post("/api/v1/staff/reset-demo", headers=auth(tok), json={"confirm": "no"}).status_code == 400
    assert client.post("/api/v1/staff/reset-demo", headers=auth(tok), json={"confirm": "RESET"}).status_code == 200
    assert client.get("/api/v1/staff/patients", headers=auth(tok)).json() == []


def test_legacy_database_is_upgraded(tmp_path):
    """A hospital.db from the old app (plain-text password, 12h times) is migrated in place."""
    import sqlite3
    import importlib
    path = tmp_path / "old.db"
    con = sqlite3.connect(path)
    con.executescript("""
        CREATE TABLE staff (username VARCHAR PRIMARY KEY, password VARCHAR);
        INSERT INTO staff VALUES ('admin', 'password123');
        CREATE TABLE patients (id VARCHAR PRIMARY KEY, first_name VARCHAR, last_name VARCHAR, dob VARCHAR,
            address VARCHAR, phone VARCHAR, email VARCHAR, insurance_provider VARCHAR, insurance_policy VARCHAR,
            insurance_group VARCHAR, face_embedding TEXT, image_path VARCHAR, registered_date VARCHAR);
        INSERT INTO patients (id, first_name, last_name, image_path, registered_date)
            VALUES ('PAT-OLD', 'Old', 'Patient', 'images/PAT-OLD.jpg', '2025-01-01');
        CREATE TABLE appointments (id VARCHAR PRIMARY KEY, patient_id VARCHAR, patient_name VARCHAR,
            department VARCHAR, physician VARCHAR, date VARCHAR, time VARCHAR, reason VARCHAR,
            room_number VARCHAR, status VARCHAR, created_at VARCHAR);
        INSERT INTO appointments (id, patient_id, time, status) VALUES ('APT-OLD', 'PAT-OLD', '2:30 PM', 'scheduled');
        CREATE TABLE audit_logs (id INTEGER PRIMARY KEY, timestamp VARCHAR, action VARCHAR, details VARCHAR, ip_address VARCHAR);
    """)
    con.commit()
    con.close()
    import database
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    old_engine, old_session = database.engine, database.SessionLocal
    try:
        database.engine = create_engine(f"sqlite:///{path}")
        database.SessionLocal = sessionmaker(bind=database.engine)
        database.init_db()
        db = database.SessionLocal()
        admin = db.query(database.StaffDB).first()
        assert admin.password.startswith("pbkdf2_sha256$") and admin.must_change_password
        assert db.query(database.AppointmentDB).first().time == "14:30"
        assert db.query(database.PatientDB).first().face_consent_at == "2025-01-01"
        db.close()
    finally:
        database.engine, database.SessionLocal = old_engine, old_session
