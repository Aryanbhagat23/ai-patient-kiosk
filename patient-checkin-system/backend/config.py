"""Clinic settings. Everything here can be overridden with environment variables."""
import os
import secrets

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.join(BASE_DIR, "images")
FRONTEND_BUILD_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "build"))

DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'hospital.db')}")

CLINIC_NAME = os.environ.get("CLINIC_NAME", "Springfield Medical")
CLINIC_TIMEZONE = os.environ.get("CLINIC_TIMEZONE", "America/New_York")

# Browser origins allowed to call the API (the React dev server). When the backend
# serves the built frontend itself, requests are same-origin and need no CORS.
ALLOWED_ORIGINS = [o.strip() for o in os.environ.get(
    "ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",") if o.strip()]

# --- Face recognition ---
FACE_MODEL = "Facenet512"
FACE_DETECTOR = os.environ.get("FACE_DETECTOR", "opencv")
# Cosine similarity needed to count as the same person. Facenet512 typically scores
# ~0.7+ for the same face and <0.3 for different people.
MATCH_THRESHOLD = float(os.environ.get("MATCH_THRESHOLD", "0.5"))
# Optional anti-spoofing (needs `pip install torch`). Off by default.
ENABLE_LIVENESS = os.environ.get("ENABLE_LIVENESS", "0") == "1"
MAX_IMAGE_BYTES = 4 * 1024 * 1024

# --- Sessions ---
STAFF_TOKEN_HOURS = 8
KIOSK_TOKEN_MINUTES = 15
DEFAULT_ADMIN_USERNAME = "admin"
DEFAULT_ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "password123")


def _load_secret_key() -> str:
    """Signing key for session tokens: env var, else a random key kept next to the database."""
    if os.environ.get("KIOSK_SECRET_KEY"):
        return os.environ["KIOSK_SECRET_KEY"]
    path = os.path.join(BASE_DIR, ".secret_key")
    if os.path.isfile(path):
        with open(path) as f:
            key = f.read().strip()
            if key:
                return key
    key = secrets.token_hex(32)
    with open(path, "w") as f:
        f.write(key)
    return key


SECRET_KEY = _load_secret_key()

# --- Scheduling ---
OPEN_WEEKDAYS = {0, 1, 2, 3, 4}  # Monday–Friday
BOOKING_WINDOW_DAYS = 60
TIME_SLOTS = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
              "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"]

DEPARTMENTS = {
    "Internal Medicine": {"physicians": ["Dr. Michael Chen", "Dr. Sarah Williams"], "rooms": ["101", "102", "103"]},
    "Cardiology": {"physicians": ["Dr. Emily Rodriguez", "Dr. James Anderson"], "rooms": ["201", "202"]},
    "Pediatrics": {"physicians": ["Dr. Lisa Brown", "Dr. David Martinez"], "rooms": ["110", "111", "112"]},
    "Orthopedics": {"physicians": ["Dr. Robert Taylor", "Dr. Jennifer Lee"], "rooms": ["301", "302"]},
    "Dermatology": {"physicians": ["Dr. Maria Garcia", "Dr. John White"], "rooms": ["120", "121"]},
    "Neurology": {"physicians": ["Dr. Amanda Johnson", "Dr. Christopher Davis"], "rooms": ["310", "311"]},
}

# Forms a patient signs once; they are asked again after FORM_VALID_DAYS.
# NOTE: template wording for demonstration. Have the clinic's legal team supply the real text.
FORM_VALID_DAYS = 365
REQUIRED_FORMS = [
    {
        "id": "hipaa",
        "title": "Notice of Privacy Practices (HIPAA)",
        "body": (
            "This notice describes how medical information about you may be used and disclosed "
            "and how you can get access to this information. We use your health information to "
            "provide treatment, obtain payment and run our clinic. We will not sell your "
            "information or share it for marketing without your written permission. You may "
            "request a copy of your records, ask for corrections, and ask us to limit certain "
            "disclosures. By signing, you acknowledge that you have received this notice."
        ),
    },
    {
        "id": "treatment",
        "title": "Consent to Treatment",
        "body": (
            "I voluntarily consent to routine examination, diagnostic procedures and medical "
            "treatment by the clinic's physicians and staff. I understand that I may ask "
            "questions about my care at any time and may refuse any treatment. For procedures "
            "beyond routine care, a separate written consent will be requested."
        ),
    },
    {
        "id": "financial",
        "title": "Financial Responsibility",
        "body": (
            "I authorize the clinic to bill my insurance provider for services provided to me. "
            "I understand that I am responsible for any co-payments, deductibles, and charges "
            "not covered by my insurance plan, and for keeping my insurance information current."
        ),
    },
]
