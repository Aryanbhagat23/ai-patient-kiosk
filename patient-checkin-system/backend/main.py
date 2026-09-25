"""AI Patient Kiosk API.

Two kinds of callers:
  * the kiosk, anonymous until a patient is identified (face scan, details lookup or
    registration); it then gets a short-lived token that only works for that patient;
  * staff, who sign in and get a token for the dashboard endpoints.
"""
import hashlib
import json
import logging
import os
import re
import threading
import uuid
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta, timezone
from typing import Optional
from zoneinfo import ZoneInfo

import cv2
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func
from sqlalchemy.orm import Session

import config
import face_engine
from database import (AppointmentDB, AuditDB, PatientDB, SessionLocal, SignedFormDB, StaffDB,
                      init_db, utcnow_iso)
from face_engine import FaceError
from security import Throttle, hash_password, make_token, read_token, verify_password

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("kiosk")

CLINIC_TZ = ZoneInfo(config.CLINIC_TIMEZONE)
ACTIVE_STATUSES = ("scheduled", "arrived")
STATUSES = ("scheduled", "arrived", "completed", "cancelled", "no_show")

staff_throttle = Throttle(max_failures=5, lock_seconds=300)
lookup_throttle = Throttle(max_failures=10, lock_seconds=300)


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
def _background_start():
    face_engine.warm_up()
    if face_engine.is_ready():
        _backfill_embeddings()


def _backfill_embeddings():
    """Patients saved while face recognition was broken have a photo but no face data."""
    db = SessionLocal()
    try:
        todo = db.query(PatientDB).filter(PatientDB.face_embedding.is_(None),
                                          PatientDB.image_path.isnot(None),
                                          PatientDB.face_consent_at.isnot(None)).all()
        for p in todo:
            path = face_engine.photo_file(p.image_path)
            img = cv2.imread(path) if path else None
            if img is None:
                continue
            try:
                p.face_embedding = json.dumps(face_engine.embed(img))
                db.commit()
                log.info("Rebuilt face data for patient %s", p.id)
            except FaceError as e:
                log.warning("Could not rebuild face data for %s: %s", p.id, e.code)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    threading.Thread(target=_background_start, daemon=True).start()
    yield


app = FastAPI(title="AI Patient Kiosk API", version="2.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=config.ALLOWED_ORIGINS, allow_credentials=False,
                   allow_methods=["GET", "POST", "PATCH", "DELETE"], allow_headers=["Authorization", "Content-Type"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def clinic_now() -> datetime:
    return datetime.now(CLINIC_TZ)


def clinic_today() -> str:
    return clinic_now().date().isoformat()


def client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def audit(db: Session, request: Request, action: str, details: str, actor: str = "kiosk"):
    db.add(AuditDB(action=action, details=details, actor=actor, ip_address=client_ip(request),
                   timestamp=utcnow_iso()))
    db.commit()


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"


def mask_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone or "")
    return f"•••-•••-{digits[-4:]}" if len(digits) >= 4 else ""


def patient_summary(p: PatientDB) -> dict:
    return {"id": p.id, "first_name": p.first_name, "last_initial": (p.last_name or "")[:1]}


def appt_dict(a: AppointmentDB) -> dict:
    return {"id": a.id, "patient_id": a.patient_id, "patient_name": a.patient_name,
            "department": a.department, "physician": a.physician, "date": a.date, "time": a.time,
            "reason": a.reason, "room": a.room_number, "status": a.status,
            "checked_in_at": a.checked_in_at, "completed_at": a.completed_at}


def pending_forms(db: Session, patient_id: str) -> list[str]:
    cutoff = (datetime.now(timezone.utc) - timedelta(days=config.FORM_VALID_DAYS)).isoformat()
    signed = {f.form_id for f in db.query(SignedFormDB).filter(SignedFormDB.patient_id == patient_id,
                                                               SignedFormDB.signed_at >= cutoff)}
    return [f["id"] for f in config.REQUIRED_FORMS if f["id"] not in signed]


def queue_info(db: Session, a: AppointmentDB) -> dict:
    ahead = db.query(AppointmentDB).filter(
        AppointmentDB.physician == a.physician, AppointmentDB.date == a.date,
        AppointmentDB.status == "arrived", AppointmentDB.checked_in_at < a.checked_in_at).count()
    return {"patients_ahead": ahead, "estimated_wait_minutes": ahead * 15}


def routing(db: Session, a: AppointmentDB) -> dict:
    return {**appt_dict(a), **queue_info(db, a)}


def minutes_between(start_iso: Optional[str], end: datetime) -> Optional[int]:
    if not start_iso:
        return None
    try:
        return max(0, int((end - datetime.fromisoformat(start_iso)).total_seconds() // 60))
    except ValueError:
        return None


def issue_kiosk_token(p: PatientDB) -> dict:
    token, exp = make_token(config.SECRET_KEY, "kiosk", p.id, config.KIOSK_TOKEN_MINUTES * 60)
    return {"token": token, "expires_at": exp, "patient": patient_summary(p)}


def _bearer(authorization: Optional[str]) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "not_authenticated")
    return authorization[7:].strip()


def kiosk_patient(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> PatientDB:
    pid = read_token(config.SECRET_KEY, _bearer(authorization), "kiosk")
    p = db.query(PatientDB).filter(PatientDB.id == pid).first() if pid else None
    if not p:
        raise HTTPException(401, "session_expired")
    return p


def staff_any(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> StaffDB:
    username = read_token(config.SECRET_KEY, _bearer(authorization), "staff")
    staff = db.query(StaffDB).filter(StaffDB.username == username).first() if username else None
    if not staff:
        raise HTTPException(401, "session_expired")
    return staff


def staff_user(staff: StaffDB = Depends(staff_any)) -> StaffDB:
    if staff.must_change_password:
        raise HTTPException(403, "password_change_required")
    return staff


# ---------------------------------------------------------------------------
# Request bodies
# ---------------------------------------------------------------------------
NAME_RE = re.compile(r"^[^\d<>{}\[\]@#$%^&*=+|\\/:;\"]{1,50}$")


def _clean_name(v: str) -> str:
    v = " ".join((v or "").split())
    if not NAME_RE.match(v):
        raise ValueError("invalid_name")
    return v


def _valid_dob(v: str) -> str:
    try:
        d = date.fromisoformat(v)
    except (ValueError, TypeError):
        raise ValueError("invalid_dob")
    if d > date.today() or d.year < 1900:
        raise ValueError("invalid_dob")
    return d.isoformat()


class Insurance(BaseModel):
    provider: str = Field("", max_length=60)
    policy: str = Field("", max_length=40)
    group: str = Field("", max_length=40)


class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    dob: str
    phone: str
    email: str = ""
    address: str = Field(..., min_length=3, max_length=200)
    insurance: Insurance = Insurance()
    face_consent: bool = False
    face_image: Optional[str] = None

    _names = field_validator("first_name", "last_name")(_clean_name)
    _dob = field_validator("dob")(_valid_dob)

    @field_validator("phone")
    @classmethod
    def _phone(cls, v):
        digits = re.sub(r"\D", "", v or "")
        if not 10 <= len(digits) <= 15:
            raise ValueError("invalid_phone")
        return digits

    @field_validator("email")
    @classmethod
    def _email(cls, v):
        v = (v or "").strip()
        if v and not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
            raise ValueError("invalid_email")
        return v


class LookupRequest(BaseModel):
    last_name: str
    dob: str
    phone_last4: str = Field(..., pattern=r"^\d{4}$")
    _name = field_validator("last_name")(_clean_name)
    _dob = field_validator("dob")(_valid_dob)


class IdentifyRequest(BaseModel):
    image: str


class CheckInRequest(BaseModel):
    appointment_id: str


class BookRequest(BaseModel):
    department: str
    physician: str
    date: str
    time: str
    reason: str = Field(..., min_length=2, max_length=200)


class Signature(BaseModel):
    form_id: str
    signature: str = Field(..., max_length=300_000)


class FormsRequest(BaseModel):
    signatures: list[Signature]


class LoginRequest(BaseModel):
    username: str = Field(..., max_length=60)
    password: str = Field(..., max_length=200)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=200)


class StatusRequest(BaseModel):
    status: str


class ResetRequest(BaseModel):
    confirm: str


# ---------------------------------------------------------------------------
# Public
# ---------------------------------------------------------------------------
@app.get("/api/v1/health")
def health():
    return {"status": "online", "clinic_name": config.CLINIC_NAME, "face": face_engine.status()}


@app.get("/api/v1/kiosk/config")
def kiosk_config():
    now = clinic_now()
    return {
        "clinic_name": config.CLINIC_NAME,
        "timezone": config.CLINIC_TIMEZONE,
        "today": now.date().isoformat(),
        "now": now.strftime("%H:%M"),
        "departments": [{"name": n, "physicians": d["physicians"]} for n, d in config.DEPARTMENTS.items()],
        "time_slots": config.TIME_SLOTS,
        "open_weekdays": sorted(config.OPEN_WEEKDAYS),
        "booking_window_days": config.BOOKING_WINDOW_DAYS,
        "forms": config.REQUIRED_FORMS,
    }


@app.post("/api/v1/kiosk/identify")
def identify(req: IdentifyRequest, request: Request, db: Session = Depends(get_db)):
    if not face_engine.is_ready():
        raise HTTPException(503, "face_unavailable")
    try:
        img = face_engine.decode_image(req.image)
        face_engine.check_liveness(img)
        emb = face_engine.embed(img)
    except FaceError as e:
        if e.code == "bad_image":
            raise HTTPException(400, "bad_image")
        if e.code == "unavailable":
            raise HTTPException(503, "face_unavailable")
        if e.code == "spoof":
            audit(db, request, "FACE_SPOOF_BLOCKED", "Liveness check failed")
        return {"status": e.code}

    best, best_score = None, 0.0
    for p in db.query(PatientDB).filter(PatientDB.face_embedding.isnot(None)):
        score = face_engine.similarity(emb, p.face_embedding)
        if score > best_score:
            best, best_score = p, score
    if not best or best_score < config.MATCH_THRESHOLD:
        audit(db, request, "FACE_NO_MATCH", f"best similarity {best_score:.2f}")
        return {"status": "no_match"}
    audit(db, request, "FACE_MATCH", f"{best.id} similarity {best_score:.2f}")
    return {"status": "match", "similarity": round(best_score, 3), **issue_kiosk_token(best)}


@app.post("/api/v1/kiosk/lookup")
def lookup(req: LookupRequest, request: Request, db: Session = Depends(get_db)):
    key = client_ip(request)
    if lookup_throttle.seconds_locked(key):
        raise HTTPException(429, "too_many_attempts")
    candidates = db.query(PatientDB).filter(func.lower(PatientDB.last_name) == req.last_name.lower(),
                                            PatientDB.dob == req.dob).all()
    matches = [p for p in candidates if re.sub(r"\D", "", p.phone or "").endswith(req.phone_last4)]
    if len(matches) != 1:
        lookup_throttle.fail(key)
        audit(db, request, "LOOKUP_FAILED", "No unique match for details")
        raise HTTPException(404, "not_found")
    lookup_throttle.reset(key)
    audit(db, request, "LOOKUP_MATCH", matches[0].id)
    return {"status": "match", **issue_kiosk_token(matches[0])}


@app.post("/api/v1/kiosk/register")
def register(req: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    dup = db.query(PatientDB).filter(func.lower(PatientDB.first_name) == req.first_name.lower(),
                                     func.lower(PatientDB.last_name) == req.last_name.lower(),
                                     PatientDB.dob == req.dob).first()
    if dup:
        raise HTTPException(409, "already_registered")

    pid = new_id("PAT")
    patient = PatientDB(id=pid, first_name=req.first_name, last_name=req.last_name, dob=req.dob,
                        address=req.address.strip(), phone=req.phone, email=req.email,
                        insurance_provider=req.insurance.provider.strip(),
                        insurance_policy=req.insurance.policy.strip(),
                        insurance_group=req.insurance.group.strip(),
                        registered_date=utcnow_iso())
    face_saved, face_error = False, None
    if req.face_consent and req.face_image:
        try:
            img = face_engine.decode_image(req.face_image)
            patient.face_embedding = json.dumps(face_engine.embed(img))
            patient.image_path = face_engine.save_photo(img, pid)
            patient.face_consent_at = utcnow_iso()
            face_saved = True
        except FaceError as e:
            face_error = e.code
    db.add(patient)
    db.commit()
    audit(db, request, "REGISTER", f"{pid} (face {'saved' if face_saved else 'not saved'})")
    return {"status": "registered", "face_saved": face_saved, "face_error": face_error,
            **issue_kiosk_token(patient)}


# ---------------------------------------------------------------------------
# Kiosk (identified patient)
# ---------------------------------------------------------------------------
@app.get("/api/v1/kiosk/me")
def kiosk_me(p: PatientDB = Depends(kiosk_patient), db: Session = Depends(get_db)):
    today = clinic_today()
    appts = db.query(AppointmentDB).filter(AppointmentDB.patient_id == p.id,
                                           AppointmentDB.date >= today,
                                           AppointmentDB.status.in_(ACTIVE_STATUSES)) \
        .order_by(AppointmentDB.date, AppointmentDB.time).all()
    todays = [a for a in appts if a.date == today]
    return {
        "patient": {"id": p.id, "first_name": p.first_name, "last_name": p.last_name, "dob": p.dob,
                    "phone": mask_phone(p.phone), "insurance_provider": p.insurance_provider,
                    "has_face": bool(p.face_embedding)},
        "today": [routing(db, a) if a.status == "arrived" else appt_dict(a) for a in todays],
        "upcoming": [appt_dict(a) for a in appts if a.date > today][:5],
        "pending_forms": pending_forms(db, p.id),
    }


@app.post("/api/v1/kiosk/forms")
def sign_forms(req: FormsRequest, request: Request, p: PatientDB = Depends(kiosk_patient),
               db: Session = Depends(get_db)):
    valid = {f["id"] for f in config.REQUIRED_FORMS}
    if not req.signatures:
        raise HTTPException(400, "no_signatures")
    for s in req.signatures:
        if s.form_id not in valid or not s.signature.startswith("data:image/png;base64,"):
            raise HTTPException(400, "invalid_signature")
    now = utcnow_iso()
    for s in req.signatures:
        db.add(SignedFormDB(patient_id=p.id, form_id=s.form_id, signature=s.signature, signed_at=now))
    db.commit()
    audit(db, request, "FORMS_SIGNED", f"{p.id}: {', '.join(s.form_id for s in req.signatures)}")
    return {"pending_forms": pending_forms(db, p.id)}


@app.post("/api/v1/kiosk/checkin")
def check_in(req: CheckInRequest, request: Request, p: PatientDB = Depends(kiosk_patient),
             db: Session = Depends(get_db)):
    a = db.query(AppointmentDB).filter(AppointmentDB.id == req.appointment_id,
                                       AppointmentDB.patient_id == p.id).first()
    if not a:
        raise HTTPException(404, "appointment_not_found")
    if a.date != clinic_today():
        raise HTTPException(409, "not_today")
    if a.status == "arrived":
        return {"status": "already_checked_in", "routing": routing(db, a)}
    if a.status != "scheduled":
        raise HTTPException(409, "not_checkable")
    if pending_forms(db, p.id):
        raise HTTPException(409, "forms_required")
    a.status = "arrived"
    a.checked_in_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    db.commit()
    audit(db, request, "CHECK_IN", f"{p.id} for {a.id}")
    return {"status": "checked_in", "routing": routing(db, a)}


def _slot_state(db: Session, physician: str, day: str) -> dict[str, str]:
    """Maps each time slot to 'open', 'taken', 'past' or 'closed'."""
    try:
        d = date.fromisoformat(day)
    except ValueError:
        raise HTTPException(400, "invalid_date")
    now = clinic_now()
    today = now.date()
    if d < today or d > today + timedelta(days=config.BOOKING_WINDOW_DAYS) or d.weekday() not in config.OPEN_WEEKDAYS:
        return {t: "closed" for t in config.TIME_SLOTS}
    taken = {a.time for a in db.query(AppointmentDB).filter(AppointmentDB.physician == physician,
                                                            AppointmentDB.date == day,
                                                            AppointmentDB.status.in_(ACTIVE_STATUSES))}
    state = {}
    for t in config.TIME_SLOTS:
        if d == today and t <= now.strftime("%H:%M"):
            state[t] = "past"
        else:
            state[t] = "taken" if t in taken else "open"
    return state


def _check_physician(department: str, physician: str):
    dept = config.DEPARTMENTS.get(department)
    if not dept or physician not in dept["physicians"]:
        raise HTTPException(400, "invalid_physician")
    return dept


@app.get("/api/v1/kiosk/availability")
def availability(department: str, physician: str, day: str = Query(..., alias="date"),
                 _p: PatientDB = Depends(kiosk_patient), db: Session = Depends(get_db)):
    _check_physician(department, physician)
    return {"slots": [{"time": t, "state": s} for t, s in _slot_state(db, physician, day).items()]}


@app.post("/api/v1/kiosk/appointments")
def book(req: BookRequest, request: Request, p: PatientDB = Depends(kiosk_patient),
         db: Session = Depends(get_db)):
    dept = _check_physician(req.department, req.physician)
    if req.time not in config.TIME_SLOTS:
        raise HTTPException(400, "invalid_time")
    state = _slot_state(db, req.physician, req.date).get(req.time)
    if state != "open":
        raise HTTPException(409, "slot_taken" if state == "taken" else "slot_unavailable")
    clash = db.query(AppointmentDB).filter(AppointmentDB.patient_id == p.id, AppointmentDB.date == req.date,
                                           AppointmentDB.time == req.time,
                                           AppointmentDB.status.in_(ACTIVE_STATUSES)).first()
    if clash:
        raise HTTPException(409, "patient_busy")
    room = dept["rooms"][dept["physicians"].index(req.physician) % len(dept["rooms"])]
    a = AppointmentDB(id=new_id("APT"), patient_id=p.id, patient_name=f"{p.first_name} {p.last_name}",
                      department=req.department, physician=req.physician, date=req.date, time=req.time,
                      reason=req.reason.strip(), room_number=room, status="scheduled", created_at=utcnow_iso())
    db.add(a)
    db.commit()
    audit(db, request, "BOOK", f"{p.id}: {a.id} {a.date} {a.time} {a.physician}")
    return {"appointment": appt_dict(a)}


@app.post("/api/v1/kiosk/appointments/{appt_id}/cancel")
def cancel(appt_id: str, request: Request, p: PatientDB = Depends(kiosk_patient), db: Session = Depends(get_db)):
    a = db.query(AppointmentDB).filter(AppointmentDB.id == appt_id, AppointmentDB.patient_id == p.id).first()
    if not a:
        raise HTTPException(404, "appointment_not_found")
    if a.status != "scheduled":
        raise HTTPException(409, "not_cancellable")
    a.status = "cancelled"
    db.commit()
    audit(db, request, "CANCEL", f"{p.id}: {a.id}")
    return {"appointment": appt_dict(a)}


# ---------------------------------------------------------------------------
# Staff
# ---------------------------------------------------------------------------
@app.post("/api/v1/staff/login")
def staff_login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    key = f"{req.username.lower()}|{client_ip(request)}"
    wait = staff_throttle.seconds_locked(key)
    if wait:
        raise HTTPException(429, f"locked:{wait}")
    staff = db.query(StaffDB).filter(StaffDB.username == req.username).first()
    if not staff or not verify_password(req.password, staff.password):
        staff_throttle.fail(key)
        audit(db, request, "STAFF_LOGIN_FAILED", f"user '{req.username[:60]}'", actor="unknown")
        raise HTTPException(401, "invalid_credentials")
    staff_throttle.reset(key)
    token, exp = make_token(config.SECRET_KEY, "staff", staff.username, config.STAFF_TOKEN_HOURS * 3600)
    audit(db, request, "STAFF_LOGIN", "signed in", actor=staff.username)
    return {"token": token, "expires_at": exp, "username": staff.username,
            "must_change_password": bool(staff.must_change_password)}


@app.post("/api/v1/staff/change-password")
def change_password(req: ChangePasswordRequest, request: Request, staff: StaffDB = Depends(staff_any),
                    db: Session = Depends(get_db)):
    if not verify_password(req.current_password, staff.password):
        raise HTTPException(400, "wrong_password")
    if req.new_password == req.current_password or req.new_password == config.DEFAULT_ADMIN_PASSWORD:
        raise HTTPException(400, "weak_password")
    staff.password = hash_password(req.new_password)
    staff.must_change_password = False
    db.commit()
    audit(db, request, "PASSWORD_CHANGED", "staff password changed", actor=staff.username)
    return {"ok": True}


@app.get("/api/v1/staff/summary")
def staff_summary(day: Optional[str] = None, staff: StaffDB = Depends(staff_user), db: Session = Depends(get_db)):
    day = day or clinic_today()
    appts = db.query(AppointmentDB).filter(AppointmentDB.date == day).all()
    counts = {s: sum(1 for a in appts if a.status == s) for s in STATUSES}
    now = datetime.now(timezone.utc)
    visit_minutes = [m for a in appts if a.status == "completed" and a.completed_at
                     for m in [minutes_between(a.checked_in_at, datetime.fromisoformat(a.completed_at))]
                     if m is not None]
    waiting = sorted((a for a in appts if a.status == "arrived"), key=lambda a: a.checked_in_at or "")
    return {
        "date": day,
        "counts": counts,
        "total": len(appts),
        "patients_total": db.query(PatientDB).count(),
        "faces_enrolled": db.query(PatientDB).filter(PatientDB.face_embedding.isnot(None)).count(),
        "avg_visit_minutes": round(sum(visit_minutes) / len(visit_minutes)) if visit_minutes else None,
        "waiting": [{**appt_dict(a), "waiting_minutes": minutes_between(a.checked_in_at, now)} for a in waiting],
        "face": face_engine.status(),
    }


@app.get("/api/v1/staff/appointments")
def staff_appointments(day: Optional[str] = None, staff: StaffDB = Depends(staff_user),
                       db: Session = Depends(get_db)):
    q = db.query(AppointmentDB)
    if day != "all":
        q = q.filter(AppointmentDB.date == (day or clinic_today()))
    now = datetime.now(timezone.utc)
    return [{**appt_dict(a), "waiting_minutes": minutes_between(a.checked_in_at, now) if a.status == "arrived" else None}
            for a in q.order_by(AppointmentDB.date.desc() if day == "all" else AppointmentDB.date,
                                AppointmentDB.time).limit(500)]


@app.patch("/api/v1/staff/appointments/{appt_id}")
def staff_set_status(appt_id: str, req: StatusRequest, request: Request, staff: StaffDB = Depends(staff_user),
                     db: Session = Depends(get_db)):
    if req.status not in STATUSES:
        raise HTTPException(400, "invalid_status")
    a = db.query(AppointmentDB).filter(AppointmentDB.id == appt_id).first()
    if not a:
        raise HTTPException(404, "appointment_not_found")
    if req.status in ACTIVE_STATUSES and a.status not in ACTIVE_STATUSES:
        clash = db.query(AppointmentDB).filter(AppointmentDB.id != a.id, AppointmentDB.physician == a.physician,
                                               AppointmentDB.date == a.date, AppointmentDB.time == a.time,
                                               AppointmentDB.status.in_(ACTIVE_STATUSES)).first()
        if clash:
            raise HTTPException(409, "slot_taken")
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    if req.status == "arrived" and not a.checked_in_at:
        a.checked_in_at = now
    if req.status == "completed":
        a.completed_at = now
        a.checked_in_at = a.checked_in_at or now
    if req.status == "scheduled":
        a.checked_in_at = a.completed_at = None
    old, a.status = a.status, req.status
    db.commit()
    audit(db, request, "STATUS_CHANGE", f"{a.id}: {old} -> {a.status}", actor=staff.username)
    return appt_dict(a)


@app.get("/api/v1/staff/patients")
def staff_patients(q: str = "", staff: StaffDB = Depends(staff_user), db: Session = Depends(get_db)):
    query = db.query(PatientDB)
    if q.strip():
        like = f"%{q.strip().lower()}%"
        query = query.filter(func.lower(PatientDB.first_name).like(like) | func.lower(PatientDB.last_name).like(like)
                             | func.lower(PatientDB.id).like(like) | PatientDB.phone.like(like))
    counts = dict(db.query(AppointmentDB.patient_id, func.count()).group_by(AppointmentDB.patient_id).all())
    return [{"id": p.id, "first_name": p.first_name, "last_name": p.last_name, "dob": p.dob, "phone": p.phone,
             "email": p.email, "address": p.address, "insurance_provider": p.insurance_provider,
             "insurance_policy": p.insurance_policy, "insurance_group": p.insurance_group,
             "has_face": bool(p.face_embedding), "has_photo": bool(face_engine.photo_file(p.image_path)),
             "registered_date": p.registered_date, "appointments": counts.get(p.id, 0)}
            for p in query.order_by(PatientDB.registered_date.desc()).limit(500)]


def _get_patient(db: Session, pid: str) -> PatientDB:
    p = db.query(PatientDB).filter(PatientDB.id == pid).first()
    if not p:
        raise HTTPException(404, "patient_not_found")
    return p


@app.get("/api/v1/staff/patients/{pid}/photo")
def staff_photo(pid: str, staff: StaffDB = Depends(staff_user), db: Session = Depends(get_db)):
    path = face_engine.photo_file(_get_patient(db, pid).image_path)
    if not path:
        raise HTTPException(404, "no_photo")
    return FileResponse(path, media_type="image/jpeg", headers={"Cache-Control": "no-store"})


@app.get("/api/v1/staff/patients/{pid}/record")
def staff_record(pid: str, request: Request, staff: StaffDB = Depends(staff_user), db: Session = Depends(get_db)):
    p = _get_patient(db, pid)
    h = int(hashlib.sha256(p.id.encode()).hexdigest(), 16)
    appts = db.query(AppointmentDB).filter(AppointmentDB.patient_id == pid) \
        .order_by(AppointmentDB.date.desc(), AppointmentDB.time.desc()).all()
    forms = db.query(SignedFormDB).filter(SignedFormDB.patient_id == pid).order_by(SignedFormDB.signed_at.desc()).all()
    audit(db, request, "RECORD_VIEWED", pid, actor=staff.username)
    return {
        "ehr": {"source": "Simulated EHR (demo data)",
                "blood_type": ["O+", "A+", "B+", "AB+", "O-", "A-"][h % 6],
                "allergies": ["None known", "Penicillin", "Peanuts", "Latex"][(h >> 4) % 4]},
        "appointments": [appt_dict(a) for a in appts],
        "forms": [{"form_id": f.form_id, "signed_at": f.signed_at} for f in forms],
    }


@app.delete("/api/v1/staff/patients/{pid}/face")
def staff_delete_face(pid: str, request: Request, staff: StaffDB = Depends(staff_user), db: Session = Depends(get_db)):
    p = _get_patient(db, pid)
    face_engine.delete_photo(p.image_path)
    p.face_embedding = p.image_path = p.face_consent_at = None
    db.commit()
    audit(db, request, "FACE_DATA_DELETED", pid, actor=staff.username)
    return {"ok": True}


@app.delete("/api/v1/staff/patients/{pid}")
def staff_delete_patient(pid: str, request: Request, staff: StaffDB = Depends(staff_user),
                         db: Session = Depends(get_db)):
    p = _get_patient(db, pid)
    face_engine.delete_photo(p.image_path)
    db.query(AppointmentDB).filter(AppointmentDB.patient_id == pid).delete()
    db.query(SignedFormDB).filter(SignedFormDB.patient_id == pid).delete()
    db.delete(p)
    db.commit()
    audit(db, request, "PATIENT_DELETED", pid, actor=staff.username)
    return {"ok": True}


@app.get("/api/v1/staff/audit")
def staff_audit(limit: int = 200, staff: StaffDB = Depends(staff_user), db: Session = Depends(get_db)):
    return [{"id": l.id, "timestamp": l.timestamp, "action": l.action, "details": l.details,
             "actor": l.actor, "ip_address": l.ip_address}
            for l in db.query(AuditDB).order_by(AuditDB.id.desc()).limit(max(1, min(limit, 1000)))]


@app.post("/api/v1/staff/reset-demo")
def staff_reset(req: ResetRequest, request: Request, staff: StaffDB = Depends(staff_user),
                db: Session = Depends(get_db)):
    if req.confirm != "RESET":
        raise HTTPException(400, "confirmation_required")
    for p in db.query(PatientDB).all():
        face_engine.delete_photo(p.image_path)
    db.query(SignedFormDB).delete()
    db.query(AppointmentDB).delete()
    db.query(PatientDB).delete()
    db.commit()
    audit(db, request, "DEMO_RESET", "all patient data deleted", actor=staff.username)
    return {"ok": True}


# ---------------------------------------------------------------------------
# Built frontend (production mode): served by the backend itself on one port.
# ---------------------------------------------------------------------------
if os.path.isfile(os.path.join(config.FRONTEND_BUILD_DIR, "index.html")):
    app.mount("/", StaticFiles(directory=config.FRONTEND_BUILD_DIR, html=True), name="frontend")
