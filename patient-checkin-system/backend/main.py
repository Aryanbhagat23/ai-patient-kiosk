import os
import json
import uuid
import base64
import numpy as np
import random
from datetime import datetime
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, Text, ForeignKey, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship

# --- AI SETUP ---
try:
    from deepface import DeepFace
    AI_AVAILABLE = True
    print("✅ AI READY: DeepFace loaded.")
except ImportError:
    AI_AVAILABLE = False
    print("⚠️ AI NOT FOUND: Running in simulation mode.")

# --- PATHS (relative to this file, so the server can be started from any folder) ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.join(BASE_DIR, "images")

# --- DATABASE ---
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'hospital.db')}")
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

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
    address = Column(String)
    phone = Column(String)
    email = Column(String)
    insurance_provider = Column(String)
    insurance_policy = Column(String)
    insurance_group = Column(String)
    face_embedding = Column(Text, nullable=True)
    image_path = Column(String, nullable=True)
    registered_date = Column(String)
    appointments = relationship("AppointmentDB", back_populates="patient")

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
    room_number = Column(String, nullable=True)
    status = Column(String, default="scheduled")
    created_at = Column(String)
    patient = relationship("PatientDB", back_populates="appointments")

class AuditDB(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(String, default=lambda: datetime.now().isoformat())
    action = Column(String)
    details = Column(String)
    ip_address = Column(String)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Patient Kiosk API (v2)")
os.makedirs(IMAGES_DIR, exist_ok=True)
app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
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
    except: pass

class LoginRequest(BaseModel):
    username: str
    password: str
class PatientRegisterRequest(BaseModel):
    firstName: str
    lastName: str
    dob: str
    address: str
    phone: str
    email: str
    insurance: dict
    faceImage: Optional[str] = None
class FaceIdentifyRequest(BaseModel):
    image_data: str
class AppointmentBookRequest(BaseModel):
    patientId: str
    department: str
    physician: str
    date: str
    time: str
    reason: str

def get_embedding(image_data: str):
    if not AI_AVAILABLE or not image_data: return None
    try:
        res = DeepFace.represent(img_path=image_data, model_name="Facenet512", enforce_detection=False)
        return json.dumps(res[0]["embedding"]) if res else None
    except: return None

def calculate_similarity(emb1, emb2):
    if not emb1 or not emb2: return 0.0
    try:
        a, b = np.array(json.loads(emb1)), np.array(json.loads(emb2))
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
    except: return 0.0

def save_image_to_disk(base64_data, patient_id):
    try:
        if not base64_data or len(base64_data) < 100: return None
        if "base64," in base64_data: base64_data = base64_data.split(",")[1]
        with open(os.path.join(IMAGES_DIR, f"{patient_id}.jpg"), "wb") as f: f.write(base64.b64decode(base64_data))
        return f"images/{patient_id}.jpg"  # URL path served by the /images mount
    except: return None

@app.get("/")
def health_check(): return {"status": "online"}

@app.post("/api/v1/staff/login")
def staff_login(req: LoginRequest, db: Session = Depends(get_db)):
    staff = db.query(StaffDB).filter(StaffDB.username == req.username, StaffDB.password == req.password).first()
    if not staff: raise HTTPException(401, "Invalid credentials")
    return {"success": True, "username": staff.username}

@app.post("/api/v1/face/identify")
def identify_patient(req: FaceIdentifyRequest, db: Session = Depends(get_db)):
    print("📸 AI Identifying...")
    cur_emb = get_embedding(req.image_data)
    if not cur_emb: return {"status": "new", "patient_id": None}
    
    best_match, highest_score = None, 0.30
    for p in db.query(PatientDB).all():
        score = calculate_similarity(cur_emb, p.face_embedding)
        if score > highest_score: highest_score, best_match = score, p

    if best_match:
        print(f"✅ MATCH: {best_match.first_name}")
        
        # --- SMART AUTO-CHECKIN FIX ---
        # Find ANY scheduled appointment, regardless of Date
        apt = db.query(AppointmentDB).filter(
            AppointmentDB.patient_id==best_match.id, 
            AppointmentDB.status=="scheduled"
        ).first()
        
        all_appts = db.query(AppointmentDB).filter(AppointmentDB.patient_id == best_match.id).order_by(AppointmentDB.date.desc()).all()
        history = [{"date": a.date, "physician": a.physician, "status": a.status} for a in all_appts]
        routing = None
        
        if apt:
            apt.status = "arrived"
            db.commit()
            log_action(db, "CHECK_IN", f"{best_match.first_name} auto-checked in.")
            routing = {"room": apt.room_number, "physician": apt.physician, "department": apt.department, "time": apt.time}
        
        return {"status": "match", "patient_id": best_match.id, "routing": routing, "history": history}
    return {"status": "new", "patient_id": None}

@app.post("/api/v1/patient/register")
def register(req: PatientRegisterRequest, db: Session = Depends(get_db)):
    new_id = f"PAT-{str(uuid.uuid4())[:8].upper()}"
    img_path = None
    emb = None
    try:
        if req.faceImage and len(str(req.faceImage)) > 100:
            img_path = save_image_to_disk(req.faceImage, new_id)
            emb = get_embedding(req.faceImage)
    except: pass
    
    db.add(PatientDB(
        id=new_id, first_name=req.firstName, last_name=req.lastName, 
        dob=req.dob, address=req.address, phone=req.phone, email=req.email,
        insurance_provider=req.insurance.get('provider',''), 
        insurance_policy=req.insurance.get('policy',''), 
        insurance_group=req.insurance.get('group',''), 
        face_embedding=emb, image_path=img_path, registered_date=datetime.now().isoformat()
    ))
    db.commit()
    return {"success": True, "patient_id": new_id}

@app.post("/api/v1/appointment/book")
def book(req: AppointmentBookRequest, db: Session = Depends(get_db)):
    p = db.query(PatientDB).filter(PatientDB.id == req.patientId).first()
    p_name = f"{p.first_name} {p.last_name}" if p else "Unknown"
    room = f"Room {random.randint(100, 400)}"
    db.add(AppointmentDB(
        id=f"APT-{str(uuid.uuid4())[:8].upper()}",
        patient_id=req.patientId, patient_name=p_name,
        department=req.department, physician=req.physician, 
        date=req.date, time=req.time, reason=req.reason, 
        room_number=room, created_at=datetime.now().isoformat()
    ))
    db.commit()
    return {"success": True}

@app.patch("/api/v1/appointment/{appt_id}/complete")
def complete_appointment(appt_id: str, db: Session = Depends(get_db)):
    apt = db.query(AppointmentDB).filter(AppointmentDB.id == appt_id).first()
    if apt: 
        apt.status = "completed"
        db.commit()
    return {"success": True}

@app.get("/api/v1/patients")
def get_patients(db: Session = Depends(get_db)): return db.query(PatientDB).all()
@app.get("/api/v1/appointments")
def get_appointments(db: Session = Depends(get_db)): return db.query(AppointmentDB).order_by(AppointmentDB.date.desc()).all()
@app.get("/api/v1/audit_logs")
def get_logs(db: Session = Depends(get_db)): return db.query(AuditDB).order_by(AuditDB.id.desc()).limit(50).all()
@app.delete("/api/v1/reset_db")
def nuke(db: Session = Depends(get_db)):
    db.query(AppointmentDB).delete(); db.query(PatientDB).delete(); db.query(AuditDB).delete(); db.commit()
    return {"status": "cleared"}
@app.get("/api/v1/integration/ehr/{patient_id}")
def fetch_ehr(patient_id: str, db: Session = Depends(get_db)):
    p = db.query(PatientDB).filter(PatientDB.id == patient_id).first()
    if not p: raise HTTPException(404, "Not found")
    appts = db.query(AppointmentDB).filter(AppointmentDB.patient_id == patient_id).order_by(AppointmentDB.date.desc()).all()
    real_history = [{"date": a.date, "physician": a.physician, "status": a.status, "reason": a.reason} for a in appts]
    return {"status":"success", "source":"Simulated_EHR", "mock_data":{"full_name":f"{p.first_name} {p.last_name}", "blood_type":"O+", "allergies":"None"}, "system_history": real_history}