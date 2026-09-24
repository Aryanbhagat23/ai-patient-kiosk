# AI Patient Kiosk

The application lives in [`patient-checkin-system/`](patient-checkin-system/). See its [README](patient-checkin-system/README.md) for setup and run instructions.

Quick start (two terminals):

```bash
# Terminal 1 – backend
cd patient-checkin-system/backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 – frontend
cd patient-checkin-system
npm install
npm start
```
