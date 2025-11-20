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

# --- 1. AI SETUP ---
try:
    from deepface import DeepFace
    AI_AVAILABLE = True
    print("✅ AI READY: DeepFace loaded.")
except ImportError:
    AI_AVAILABLE = False
    print("⚠️ AI NOT FOUND: Running in simulation mode.")

# =========================================
# 2. DATABASE SETUP
# =========================================
SQLALCHEMY_DATABASE_URL = "sqlite:///./hospital.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 3. DATABASE MODELS (TABLES) ---
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
    image_path = Column(String, nullable=True) # For admin photo
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
    room_number = Column(String, nullable=True) # For routing
    status = Column(String, default="scheduled") # scheduled, arrived, completed
    created_at = Column(String)
    
    patient = relationship("PatientDB", back_populates="appointments")

class AuditDB(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(String, default=lambda: datetime.now().isoformat())
    action = Column(String)
    details = Column(String)
    ip_address = Column(String)

Base.metadata.create_all(bind=engine) # This creates all tables

# =========================================
# 4. FASTAPI APP & CONFIG
# =========================================
app = FastAPI(title="AI Patient Kiosk API (v2)")

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
# 5. DATA MODELS (for API input/output)
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

class AppointmentHistoryItem(BaseModel):
    date: str
    physician: str
    status: str

# =========================================
# 6. AI & IMAGE HELPERS
# =========================================
def get_embedding(image_data: str):
    if not AI_AVAILABLE: return None
    try:
        res = DeepFace.represent(img_path=image_data, model_name="Facenet512", enforce_detection=False)
        return json.dumps(res[0]["embedding"]) if res else None
    except Exception as e:
        print(f"AI embedding error: {e}")
        return None

def calculate_similarity(emb1, emb2):
    if not emb1 or not emb2: return 0.0
    a, b = np.array(json.loads(emb1)), np.array(json.loads(emb2))
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def save_image_to_disk(base64_data, patient_id):
    try:
        if "base64," in base64_data:
            base64_data = base64_data.split(",")[1]
        
        file_path = f"images/{patient_id}.jpg"
        with open(file_path, "wb") as f:
            f.write(base64.b64decode(base64_data))
        return file_path
    except Exception as e:
        print(f"Image save error: {e}")
        return None

# =========================================
# 7. API ENDPOINTS
# =========================================

@app.get("/")
def health_check():
    return {"status": "online", "ai_enabled": AI_AVAILABLE}

@app.post("/api/v1/staff/login")
def staff_login(req: LoginRequest, db: Session = Depends(get_db)):
    staff = db.query(StaffDB).filter(StaffDB.username == req.username, StaffDB.password == req.password).first()
    if not staff:
        log_action(db, "LOGIN_FAILED", f"User: {req.username}")
        raise HTTPException(401, "Invalid credentials")
    log_action(db, "LOGIN_SUCCESS", f"User: {req.username}")
    return {"success": True, "username": staff.username}

@app.post("/api/v1/face/identify")
def identify_patient(req: FaceIdentifyRequest, db: Session = Depends(get_db)):
    print("📸 AI Identifying...")
    cur_emb = get_embedding(req.image_data)
    if not cur_emb: 
        print("❌ AI could not find a face in the image.")
        return {"status": "new", "patient_id": None}

    # --- THIS IS THE FIX ---
    # We lowered the threshold from 0.4 to 0.30 to be less strict
    best_match, highest_score = None, 0.30
    
    print(f"   Comparing against {db.query(PatientDB).count()} registered patients...")

    for p in db.query(PatientDB).all():
        score = calculate_similarity(cur_emb, p.face_embedding)
        print(f"   ... score for {p.first_name}: {score:.2f}")
        if score > highest_score: 
            highest_score, best_match = score, p

    if best_match:
        print(f"✅ MATCH FOUND: {best_match.first_name} (Score: {highest_score:.2f})")
        today = datetime.now().strftime("%Y-%m-%d")
        apt = db.query(AppointmentDB).filter(AppointmentDB.patient_id==best_match.id, AppointmentDB.date==today, AppointmentDB.status=="scheduled").first()
        
        all_appts = db.query(AppointmentDB).filter(AppointmentDB.patient_id == best_match.id).order_by(AppointmentDB.date.desc()).all()
        history = [{"date": a.date, "physician": a.physician, "status": a.status} for a in all_appts]

        routing = None
        if apt:
            apt.status = "arrived"
            db.commit()
            log_action(db, "CHECK_IN", f"{best_match.first_name} checked in.")
            routing = {"room": apt.room_number, "physician": apt.physician, "department": apt.department, "time": apt.time}
        
        return {"status": "match", "patient_id": best_match.id, "routing": routing, "history": history}
        
    print("❌ NO MATCH FOUND (Threshold not met)")
    return {"status": "new", "patient_id": None}

@app.post("/api/v1/patient/register")
def register(req: PatientRegisterRequest, db: Session = Depends(get_db)):
    new_id = f"PAT-{str(uuid.uuid4())[:8].upper()}"
    
    img_path = save_image_to_disk(req.faceImage, new_id)
    emb = get_embedding(req.faceImage)
    
    db.add(PatientDB(
        id=new_id, first_name=req.firstName, last_name=req.lastName, 
        dob=req.dob, address=req.address, phone=req.phone, email=req.email,
        insurance_provider=req.insurance.provider, 
        insurance_policy=req.insurance.policy, 
        insurance_group=req.insurance.group, 
        face_embedding=emb, 
        image_path=img_path, 
        registered_date=datetime.now().isoformat()
    ))
    db.commit()
    log_action(db, "REGISTER", f"New patient: {new_id}")
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
    log_action(db, "APPOINTMENT", f"Booked for {req.patientId} in {room}")
    return {"success": True}

@app.patch("/api/v1/appointment/{appt_id}/complete")
def complete_appointment(appt_id: str, db: Session = Depends(get_db)):
    apt = db.query(AppointmentDB).filter(AppointmentDB.id == appt_id).first()
    if not apt:
        raise HTTPException(404, "Appointment not found")
    
    apt.status = "completed"
    db.commit()
    log_action(db, "COMPLETED", f"Appointment {apt.id} for {apt.patient_name} marked as completed.")
    return {"success": True, "id": apt.id, "status": "completed"}


# --- ADMIN ENDPOINTS ---
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

@app.get("/api/v1/integration/ehr/{patient_id}")
def fetch_ehr(patient_id: str, db: Session = Depends(get_db)):
    p = db.query(PatientDB).filter(PatientDB.id == patient_id).first()
    if not p: raise HTTPException(404, "Not found")
    log_action(db, "EHR_ACCESS", f"Viewed EHR for {patient_id}")
    
    appts = db.query(AppointmentDB).filter(AppointmentDB.patient_id == patient_id).order_by(AppointmentDB.date.desc()).all()
    real_history = [{"date": a.date, "physician": a.physician, "status": a.status, "reason": a.reason} for a in appts]

    return {
        "status":"success", 
        "source":"Simulated_EHR", 
        "mock_data":{
            "full_name":f"{p.first_name} {p.last_name}", 
            "blood_type":random.choice(["A+","O+"]), 
            "allergies":random.choice(["None","Peanuts"]), 
            "last_visit":"2024-01-15"
        },
        "system_history": real_history
    }