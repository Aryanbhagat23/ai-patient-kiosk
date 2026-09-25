# AI-Powered Patient Check-In Kiosk

React kiosk + staff dashboard, served by a Python (FastAPI) backend with on-device face recognition (DeepFace / Facenet512). Nothing is sent to external services.

## Quick start

From the repository root run `start.bat` (Windows) or `./start.sh` (macOS / Linux). It:

1. picks a supported Python (3.9 – 3.12) and creates `backend/venv` (rebuilt automatically when `requirements.txt` changes),
2. installs frontend packages (again when `package-lock.json` changes),
3. builds the app when the source changed, and
4. serves everything on **http://localhost:8000**, then opens the browser.

Requirements: **Node.js 18+**, **Python 3.9 – 3.12** (TensorFlow does not support newer Python yet), and a webcam for face check-in.

## What patients can do

| Flow | Details |
| --- | --- |
| **Face check-in** | Automatic 3-second countdown scan. A match asks "Is this you, Maria L.?" before anything is shown, so a wrong match can't expose someone else's data. No match / no face → try again, enter details, or register. |
| **Check in with details** | Last name + date of birth + last 4 digits of phone (no camera needed). Throttled against guessing. |
| **Register** | 3 steps: details → insurance (or self-pay) → optional face enrollment with explicit consent. Duplicate registrations are detected. |
| **Today & upcoming** | Shows today's appointment with a *Check in now* button, and upcoming appointments that can be cancelled. |
| **Forms** | HIPAA notice, consent to treatment and financial responsibility, signed with a finger. Valid for 1 year. |
| **Check-in** | Only for today's appointment (clinic time zone). Shows the room, doctor and how many patients are ahead. |
| **Booking** | Department → doctor → day (weekdays, next 60 days) → live available times → reason → review. Double-booking is prevented. |
| **Languages** | English, Español, Français, 中文. |
| **Privacy** | The session is cleared after 75 s of inactivity (with a 20 s warning) and after every finished visit. |

## Staff dashboard

Click the lock icon at the bottom-left of the kiosk.

- **First sign-in:** `admin` / `password123`. You must set a new password before seeing any data.
- **Today:** waiting room with live wait times, today's schedule, and the counts (scheduled, waiting, completed, no-shows, average visit length).
- **Appointments:** any date. Actions: check in, complete, no-show, cancel, restore.
- **Patients:** search; open a record to see the photo, simulated EHR data, visit history and signed forms. Delete face data only, or the whole patient (privacy requests).
- **Audit log:** sign-ins (including failures), face matches, lookups, registrations, check-ins, record views and deletions, with IP addresses.
- **Reset demo data:** type `RESET` to delete all patients, appointments and photos.
- Signs out automatically after 15 minutes of inactivity.

## Security & reliability

- Staff passwords are hashed with PBKDF2 (200,000 iterations). The default password must be changed. 5 failed sign-ins lock the account for 5 minutes.
- Every staff endpoint needs a signed, expiring token (8 h). Patient photos are only served to signed-in staff.
- After identification the kiosk gets a 15-minute token that only works for that one patient. It can't read or change anyone else's data.
- The API never returns face embeddings. Photos are re-encoded (metadata stripped) and stored in `backend/images/`.
- All input is validated on the server. Uploads are size-limited and must decode as real images.
- CORS only allows the local dev server. In normal use the app and API share one origin.
- Old databases are upgraded in place on start. That covers plain-text passwords, 12-hour times, missing columns, and missing face data rebuilt from stored photos.

## Configuration (environment variables, optional)

| Variable | Default | Meaning |
| --- | --- | --- |
| `CLINIC_NAME` | Springfield Medical | Shown on the kiosk |
| `CLINIC_TIMEZONE` | America/New_York | Defines "today" for check-in and booking |
| `ADMIN_PASSWORD` | password123 | Initial admin password (must be changed on first sign-in) |
| `MATCH_THRESHOLD` | 0.5 | Face similarity needed for a match (same person ≈ 0.7+, different < 0.3) |
| `ENABLE_LIVENESS` | 0 | `1` enables DeepFace anti-spoofing (also run `pip install torch` in `backend/venv`) |
| `ALLOWED_ORIGINS` | http://localhost:3000,… | Extra browser origins allowed to call the API |
| `KIOSK_SECRET_KEY` | generated | Token signing key; otherwise stored in `backend/.secret_key` |

Departments, doctors, rooms, time slots and form texts are in `backend/config.py`. The form texts are templates; have the clinic's legal team supply the real wording.

## Tests

```bash
cd patient-checkin-system/backend && ./venv/bin/python -m pytest      # Windows: venv\Scripts\python -m pytest
cd patient-checkin-system && npm test
```

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `Python 3.9 - 3.12 is required` | Install Python 3.11 from python.org (tick "Add python.exe to PATH"), open a new terminal, run the script again. |
| `The filename or extension is too long` (Windows) | Move the project to a short path outside OneDrive, e.g. `C:\kiosk`, delete `patient-checkin-system\backend\venv`, run again. |
| "Face check-in is starting up" | The face model loads for ~10–30 s after start (downloads ~95 MB the very first time). |
| Face scan always says "not recognised" | Check the staff dashboard header says *Face recognition ready*. Register again with the consent box ticked, in good light, facing the camera. |
| Camera doesn't turn on | Allow camera access in the browser. The page must be opened as `http://localhost`, not an IP address. |
| Port 8000 already in use | Close the other program (or an older kiosk window) and run again. |
| Forgot the staff password | In `patient-checkin-system/backend` run `venv\Scripts\python reset_admin.py` (macOS/Linux: `./venv/bin/python reset_admin.py`), then sign in with `password123` and choose a new password. |
