"""Database models and a small in-place migration for databases created by older versions."""
import re
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

import config
from security import hash_password, is_hashed

engine = create_engine(config.DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class StaffDB(Base):
    __tablename__ = "staff"
    username = Column(String, primary_key=True, index=True)
    password = Column(String)  # PBKDF2 hash
    must_change_password = Column(Boolean, default=False)


class PatientDB(Base):
    __tablename__ = "patients"
    id = Column(String, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    dob = Column(String)  # YYYY-MM-DD
    address = Column(String)
    phone = Column(String)
    email = Column(String)
    insurance_provider = Column(String)
    insurance_policy = Column(String)
    insurance_group = Column(String)
    face_embedding = Column(Text, nullable=True)
    image_path = Column(String, nullable=True)
    face_consent_at = Column(String, nullable=True)
    registered_date = Column(String)


class AppointmentDB(Base):
    __tablename__ = "appointments"
    id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("patients.id"), index=True)
    patient_name = Column(String)
    department = Column(String)
    physician = Column(String)
    date = Column(String, index=True)  # YYYY-MM-DD in clinic time
    time = Column(String)  # HH:MM (24h) in clinic time
    reason = Column(String)
    room_number = Column(String, nullable=True)
    status = Column(String, default="scheduled")  # scheduled|arrived|completed|cancelled|no_show
    created_at = Column(String)
    checked_in_at = Column(String, nullable=True)
    completed_at = Column(String, nullable=True)


class SignedFormDB(Base):
    __tablename__ = "signed_forms"
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String, ForeignKey("patients.id"), index=True)
    form_id = Column(String)
    signature = Column(Text)  # PNG data URL
    signed_at = Column(String)


class AuditDB(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(String, default=utcnow_iso)
    action = Column(String)
    details = Column(String)
    actor = Column(String, nullable=True)
    ip_address = Column(String)


_TIME_12H = re.compile(r"^\s*(\d{1,2}):(\d{2})\s*([AaPp][Mm])\s*$")


def normalize_time(value: str) -> str:
    """'9:00 AM' -> '09:00'. Values already in HH:MM are returned unchanged."""
    m = _TIME_12H.match(value or "")
    if not m:
        return value
    hour, minute, ampm = int(m.group(1)), m.group(2), m.group(3).upper()
    if ampm == "PM" and hour != 12:
        hour += 12
    if ampm == "AM" and hour == 12:
        hour = 0
    return f"{hour:02d}:{minute}"


def init_db():
    """Create tables, add columns missing from older databases, and upgrade legacy data."""
    Base.metadata.create_all(bind=engine)
    insp = inspect(engine)
    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            existing = {c["name"] for c in insp.get_columns(table.name)}
            for col in table.columns:
                if col.name not in existing:
                    ddl_type = col.type.compile(dialect=engine.dialect)
                    conn.execute(text(f'ALTER TABLE {table.name} ADD COLUMN "{col.name}" {ddl_type}'))

    db = SessionLocal()
    try:
        # Old versions stored staff passwords in plain text.
        for staff in db.query(StaffDB).all():
            if not is_hashed(staff.password):
                is_default = staff.password == config.DEFAULT_ADMIN_PASSWORD
                staff.password = hash_password(staff.password or "")
                staff.must_change_password = is_default
        if not db.query(StaffDB).filter(StaffDB.username == config.DEFAULT_ADMIN_USERNAME).first():
            db.add(StaffDB(username=config.DEFAULT_ADMIN_USERNAME,
                           password=hash_password(config.DEFAULT_ADMIN_PASSWORD),
                           must_change_password=True))
        # Old versions stored times like "9:00 AM".
        for appt in db.query(AppointmentDB).all():
            normalized = normalize_time(appt.time)
            if normalized != appt.time:
                appt.time = normalized
            if not appt.status:
                appt.status = "scheduled"
        # Patients registered with a face scan by older versions consented by using it.
        for p in db.query(PatientDB).filter(PatientDB.image_path.isnot(None),
                                            PatientDB.face_consent_at.is_(None)).all():
            p.face_consent_at = p.registered_date or utcnow_iso()
        db.commit()
    finally:
        db.close()
