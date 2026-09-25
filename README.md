# AI Patient Kiosk

A self-service check-in kiosk for clinics. Patients check in by face scan or with their details, register, sign intake forms, and book appointments in four languages. Staff get a live dashboard with the waiting room, schedule, patient records and an audit log.

The application lives in [`patient-checkin-system/`](patient-checkin-system/). See its [README](patient-checkin-system/README.md) for features, security, configuration and troubleshooting.

## Run it (one command)

You need **Node.js 18+** and **Python 3.9 – 3.12** installed.

- **Windows:** double-click `start.bat` (or run `.\start.bat` in PowerShell).
- **macOS / Linux:** run `./start.sh`.

The first run installs everything and builds the app (several minutes, since TensorFlow is large). After that it starts in seconds. Your browser opens at **http://localhost:8000** when it's ready.

**Staff:** click the small lock icon at the bottom-left of the kiosk. The first sign-in is `admin` / `password123`, and you'll be asked to choose a new password.

Developers can run `start.bat dev` / `./start.sh dev` for live reload (frontend on :3000, API on :8000).
