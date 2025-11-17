import os
import json
import uuid
import base64
import numpy as np
import pytz
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, Text, ForeignKey, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from deepface import DeepFace

# =========================================
# AI SETUP
# =========================================
try:
    AI_AVAILABLE = True
    print("✅ AI READY: DeepFace loaded.")
except ImportError:
    AI_AVAILABLE = False
    print("⚠️ AI NOT FOUND: Running in simulation mode.")

# =========================================
# DATABASE SETUP
# =========================================
SQLALCHEMY_DATABASE_URL = "sqlite:///./hospital.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- MODELS ---
class StaffDB(Base):
    __tablename__ = "staff"
    username = Column(String, primary_key=True, index=True)
    password = Column(String)

class PatientDB(Base):
    __tablename__ = "patients"
    id = Column(String, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    dob = Column(String)
    phone = Column(String)
    email = Column(String)
    address = Column(String)
    insurance_provider = Column(String)
    insurance_policy = Column(String)
    insurance_group = Column(String)
    face_embedding = Column(Text, nullable=True)
    image_path = Column(String, nullable=True)
    registered_date = Column(String)

class AppointmentDB(Base):
    __tablename__ = "appointments"
    id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("patients.id"))
    patient_name = Column(String)
    department = Column(String)
    physician = Column(String)
    date = Column(String)
    time = Column(String)
    reason = Column(String)
    status = Column(String, default="scheduled")
    room_number = Column(String, nullable=True)
    created_at = Column(String)

class AuditDB(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(String, default=lambda: datetime.now().isoformat())
    action = Column(String)
    details = Column(String)
    ip_address = Column(String)

Base.metadata.create_all(bind=engine)

# =========================================
# APP CONFIG
# =========================================
app = FastAPI(title="AI Patient Kiosk API")

# MOUNT IMAGES FOLDER
os.makedirs("images", exist_ok=True)
app.mount("/images", StaticFiles(directory="images"), name="images")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        if not db.query(StaffDB).filter(StaffDB.username == "admin").first():
            db.add(StaffDB(username="admin", password="password123"))
            db.commit()
        yield db
    finally:
        db.close()

def log_action(db: Session, action: str, details: str):
    try:
        db.add(AuditDB(action=action, details=details, ip_address="127.0.0.1"))
        db.commit()
        print(f"🔒 AUDIT: [{action}] {details}")
    except: pass

# =========================================
# DATA MODELS
# =========================================
class LoginRequest(BaseModel):
    username: str
    password: str
class InsuranceData(BaseModel):
    provider: str
    policy: str
    group: str
class PatientRegisterRequest(BaseModel):
    firstName: str
    lastName: str
    dob: str
    address: str
    phone: str
    email: str
    insurance: InsuranceData
    faceImage: str
class FaceIdentifyRequest(BaseModel):
    image_data: str
class AppointmentBookRequest(BaseModel):
    patientId: str
    department: str
    physician: str
    date: str
    time: str
    reason: str

# =========================================
# HELPERS
# =========================================
def get_embedding(image_data: str):
    if not AI_AVAILABLE: return None
    try:
        res = DeepFace.represent(img_path=image_data, model_name="Facenet", enforce_detection=False)
        return json.dumps(res[0]["embedding"]) if res else None
    except: return None

def calculate_similarity(emb1, emb2):
    if not emb1 or not emb2: return 0.0
    a, b = np.array(json.loads(emb1)), np.array(json.loads(emb2))
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def save_image(base64_data, patient_id):
    try:
        if "base64," in base64_data: base64_data = base64_data.split(",")[1]
        path = f"images/{patient_id}.jpg"
        with open(path, "wb") as f: f.write(base64.b64decode(base64_data))
        return path
    except: return None

# =========================================
# API ENDPOINTS
# =========================================

# --- FIXED: ADDED MISSING HEALTH CHECK ---
@app.get("/")
def health_check():
    return {"status": "online", "ai_enabled": AI_AVAILABLE}

@app.post("/api/v1/staff/login")
def staff_login(req: LoginRequest, db: Session = Depends(get_db)):
    if not db.query(StaffDB).filter(StaffDB.username==req.username, StaffDB.password==req.password).first():
        log_action(db, "LOGIN_FAILED", f"User: {req.username}")
        raise HTTPException(401, "Invalid credentials")
    log_action(db, "LOGIN_SUCCESS", f"User: {req.username}")
    return {"success": True, "username": req.username}

@app.post("/api/v1/face/identify")
def identify_patient(req: FaceIdentifyRequest, db: Session = Depends(get_db)):
    print("📸 AI Identifying...")
    cur_emb = get_embedding(req.image_data)
    if not cur_emb: return {"status": "new", "patient_id": None}
    print("Embedding length:", len(cur_emb))
    print("First 5 values:", cur_emb[:5])

    best_match, highest_score = None, 0.4
    for p in db.query(PatientDB).all():
        score = calculate_similarity(cur_emb, p.face_embedding)
        print("Distance Score:", score)  # e.g. cosine distance or L2
        if score > highest_score: highest_score, best_match = score, p

    if best_match:
        today = datetime.now().strftime("%Y-%m-%d")
        apt = db.query(AppointmentDB).filter(AppointmentDB.patient_id==best_match.id, AppointmentDB.date==today, AppointmentDB.status=="scheduled").first()
        routing = None
        if apt:
            apt.status = "arrived"
            db.commit()
            log_action(db, "CHECK_IN", f"{best_match.first_name} checked in.")
            routing = {"room": apt.room_number, "physician": apt.physician, "department": apt.department, "time": apt.time}
        return {"status": "match", "patient_id": best_match.id, "routing": routing}
    return {"status": "new", "patient_id": None}

@app.post("/api/v1/patient/register")
def register(req: PatientRegisterRequest, db: Session = Depends(get_db)):
    new_id = f"PAT-{str(uuid.uuid4())[:8].upper()}"
    img_path = save_image(req.faceImage, new_id)
    db.add(PatientDB(id=new_id, first_name=req.firstName, last_name=req.lastName, dob=req.dob, phone=req.phone, email=req.email, address=req.address, insurance_provider=req.insurance.provider, insurance_policy=req.insurance.policy, insurance_group=req.insurance.group, face_embedding=get_embedding(req.faceImage), image_path=img_path, registered_date=datetime.now().isoformat()))
    db.commit()
    log_action(db, "REGISTER", f"New patient: {new_id}")
    # return {"success": True, "patient_id": new_id}
    return {
    "success": True,
    "patient_id": new_id,
    "patient": {
        "id": new_id,
        "first_name": req.firstName,
        "last_name": req.lastName,
        "dob": req.dob,
        "address": req.address,
        "phone": req.phone,
        "email": req.email,
        "insurance": {
            "provider": req.insurance.provider,
            "policy": req.insurance.policy,
            "group": req.insurance.group
        }
    }
}

@app.post("/api/v1/appointment/book")
def book(req: AppointmentBookRequest, db: Session = Depends(get_db)):
    p = db.query(PatientDB).filter(PatientDB.id == req.patientId).first()
    import random
    room = f"Room {random.randint(100, 400)}"
    db.add(AppointmentDB(id=f"APT-{str(uuid.uuid4())[:8].upper()}", patient_id=req.patientId, patient_name=f"{p.first_name} {p.last_name}" if p else "Unknown", department=req.department, physician=req.physician, date=req.date, time=req.time, reason=req.reason, room_number=room, created_at=datetime.now().isoformat()))
    db.commit()
    log_action(db, "APPOINTMENT", f"Booked for {req.patientId} in {room}")
    # return {"success": True}
    return {
    "success": True,
    "appointment": {
        "room_number": room,
        "department": req.department,
        "physician": req.physician,
        "date": req.date,
        "time": req.time,
        "reason": req.reason or "",
        "status": "scheduled"
    }
}


@app.get("/api/v1/patients")
def get_patients(db: Session = Depends(get_db)): return db.query(PatientDB).all()
@app.get("/api/v1/appointments")
def get_appointments(db: Session = Depends(get_db)): return db.query(AppointmentDB).order_by(AppointmentDB.date.desc(), AppointmentDB.time.asc()).all()
@app.get("/api/v1/audit_logs")
def get_logs(db: Session = Depends(get_db)): return db.query(AuditDB).order_by(AuditDB.id.desc()).limit(50).all()
@app.delete("/api/v1/reset_db")
def nuke(db: Session = Depends(get_db)):
    db.query(AppointmentDB).delete(); db.query(PatientDB).delete(); db.query(AuditDB).delete(); db.commit()
    log_action(db, "SYSTEM_RESET", "Admin wiped database.")
    return {"status": "cleared"}

# --- MOCK EHR ---
@app.get("/api/v1/integration/ehr/{patient_id}")
def fetch_ehr(patient_id: str, db: Session = Depends(get_db)):
    p = db.query(PatientDB).filter(PatientDB.id == patient_id).first()
    if not p: raise HTTPException(404, "Not found")
    log_action(db, "EHR_ACCESS", f"Viewed EHR for {patient_id}")
    import random
    return {"status":"success", "source":"Simulated_EHR", "data":{"full_name":f"{p.first_name} {p.last_name}", "blood_type":random.choice(["A+","O+"]), "allergies":random.choice(["None","Peanuts"]), "last_visit":"2024-02-20"}}

# @app.get("/api/v1/appointments/upcoming")
# def get_upcoming_appointment(patient_id: str, db: Session = Depends(get_db)):
#     # Get all scheduled appointments for this patient
#     appts = db.query(AppointmentDB).filter(
#         AppointmentDB.patient_id == patient_id,
#         AppointmentDB.status == "scheduled"
#     ).all()

#     if not appts:
#         return {}

#     # Parse next upcoming by date + time
#     def parse_dt(appt):
#         try:
#             return datetime.strptime(
#                 f"{appt.date} {appt.time}", "%Y-%m-%d %I:%M %p"
#             )
#         except:
#             return datetime.max

#     appts.sort(key=parse_dt)

#     next_appt = appts[0]

#     return {
#         "date": next_appt.date,
#         "time": next_appt.time,
#         "physician": next_appt.physician,
#         "department": next_appt.department,
#         "room": next_appt.room_number,
#         "reason": next_appt.reason
#     }
@app.get("/api/v1/appointments/upcoming")
def get_upcoming(patient_id: str, db: Session = Depends(get_db)):
    # today = datetime.now().date().isoformat()
    local = pytz.timezone("America/New_York")    # <-- FLORIDA
    today = datetime.now(local).date().isoformat()

    appt = (
        db.query(AppointmentDB)
        .filter(
            AppointmentDB.patient_id == patient_id,
            AppointmentDB.date > today
        )
        .order_by(AppointmentDB.date.asc())
        .first()
    )

    if not appt:
        return {}

    return {
        "id": appt.id,
        "patient_id": appt.patient_id,
        "date": appt.date,
        "time": appt.time,
        "physician": appt.physician,
        "department": appt.department,
        "room": appt.room_number,
        "status": appt.status,
    }

@app.get("/api/v1/appointments/today/{patient_id}")
def get_today_appt(patient_id: str, db: Session = Depends(get_db)):
    # today = datetime.now().date().isoformat()


    local = pytz.timezone("America/New_York")    # <-- FLORIDA
    today = datetime.now(local).date().isoformat()
    appts = db.query(AppointmentDB).filter(
        AppointmentDB.patient_id == patient_id,
        AppointmentDB.date == today
    ).all()
    return appts
@app.get("/api/v1/appointments/latest")
def get_latest_appointment(patient_id: str, db: Session = Depends(get_db)):
    # today = datetime.now().date().isoformat()
    local = pytz.timezone("America/New_York")    # <-- FLORIDA
    today = datetime.now(local).date().isoformat()

    # 1) Try to find a SCHEDULED appointment for today
    appt_today = (
        db.query(AppointmentDB)
        .filter(
            AppointmentDB.patient_id == patient_id,
            AppointmentDB.date == today,
            AppointmentDB.status == "scheduled",  # only scheduled, not arrived/completed
        )
        .order_by(AppointmentDB.time)
        .first()
    )

    if appt_today:
        return {
            "date": appt_today.date,
            "time": appt_today.time,
            "physician": appt_today.physician,
            "department": appt_today.department,
            "room": appt_today.room_number,  # ✅ correct field name
            "status": appt_today.status,
        }

    # 2) Otherwise, get the NEXT upcoming SCHEDULED appointment
    next_appt = (
        db.query(AppointmentDB)
        .filter(
            AppointmentDB.patient_id == patient_id,
            AppointmentDB.date > today,
            AppointmentDB.status == "scheduled",
        )
        .order_by(AppointmentDB.date, AppointmentDB.time)
        .first()
    )

    if next_appt:
        return {
            "date": next_appt.date,
            "time": next_appt.time,
            "physician": next_appt.physician,
            "department": next_appt.department,
            "room": next_appt.room_number,   # ✅ correct field name
            "status": next_appt.status,
        }

    # 3) No today/upcoming appointment
    return {}

# @app.get("/api/v1/appointments/latest")
# def get_latest_appointment(patient_id: str, db: Session = Depends(get_db)):
#     today = datetime.now().date().isoformat()

#     # Try today's appointment first
#     appt_today = (
#         db.query(AppointmentDB)
#         .filter(AppointmentDB.patient_id == patient_id,
#                 AppointmentDB.date == today)
#         .first()
#     )

#     if appt_today:
#         return {
#             "date": appt_today.date,
#             "time": appt_today.time,
#             "physician": appt_today.physician,
#             "department": appt_today.department,
#             "room": appt_today.room,
#             "status": appt_today.status
#         }

#     # Otherwise upcoming
#     next_appt = (
#         db.query(AppointmentDB)
#         .filter(AppointmentDB.patient_id == patient_id,
#                 AppointmentDB.date > today)
#         .order_by(AppointmentDB.date)
#         .first()
#     )

#     if next_appt:
#         return {
#             "date": next_appt.date,
#             "time": next_appt.time,
#             "physician": next_appt.physician,
#             "department": next_appt.department,
#             "room": next_appt.room,
#             "status": next_appt.status
#         }

#     return {}
