# AI-Powered Patient Check-In System

A React kiosk frontend plus a Python (FastAPI) backend. **You must run both, in two separate terminals.**

> All commands below are run from inside this `patient-checkin-system/` folder,
> not from the repository root.

## Requirements

- **Node.js** 18 or newer (includes `npm`)
- **Python 3.9 – 3.12** (TensorFlow, used by DeepFace, does not support newer Python versions yet)

## 1. Backend (terminal 1)

```bash
cd patient-checkin-system/backend

# Create and activate a virtual environment
python -m venv venv
# macOS / Linux:
source venv/bin/activate
# Windows (PowerShell):
#   venv\Scripts\Activate.ps1

# Install dependencies (large download: TensorFlow + DeepFace)
pip install -r requirements.txt

# Run the server (downloads the face model on first use)
uvicorn main:app --reload --port 8000
```

Wait for `Application startup complete`. Open http://localhost:8000 and you should see `{"status":"online"}`.

If DeepFace fails to install, the backend still starts in **simulation mode** without face recognition.

## 2. Frontend (terminal 2)

```bash
cd patient-checkin-system

npm install
npm start
```

The app opens at http://localhost:3000. It talks to the backend at `http://localhost:8000`, so keep terminal 1 running.

## Default staff login

Click the red lock button in the bottom-right corner.

- Username: `admin`
- Password: `password123`

## Tests

```bash
# Backend (from backend/, with venv active)
pytest

# Frontend
npm test
```

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `npm ERR! enoent Could not read package.json` | You are in the repo root. `cd patient-checkin-system` first. |
| `Error loading ASGI app. Could not import module "main"` | Run `uvicorn` from inside `backend/`. |
| `No matching distribution found for tensorflow` | Your Python is too new. Install Python 3.11 and recreate the venv. |
| Kiosk shows no data / "Failed to fetch" | The backend isn't running on port 8000. |
| Camera doesn't turn on | Allow camera access in the browser; use `http://localhost`, not an IP address. |
| Port 3000 or 8000 already in use | Stop the other process, or run `uvicorn main:app --port 8001` (then update the URLs in `src/`). |
