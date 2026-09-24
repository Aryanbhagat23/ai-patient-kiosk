@echo off
REM One-command launcher for Windows.
REM Sets up the backend venv and frontend packages on first run, then starts both.
setlocal
set "ROOT=%~dp0"
set "APP=%ROOT%patient-checkin-system"
set "BACKEND=%APP%\backend"

where npm >nul 2>nul || (echo Node.js is required. Install it from https://nodejs.org/ & pause & exit /b 1)

REM --- Pick a Python that TensorFlow supports (3.9 - 3.12) via the py launcher ---
set "PY="
for %%v in (3.12 3.11 3.10 3.9) do (
  if not defined PY (
    py -%%v -c "print()" >nul 2>nul && set "PY=py -%%v"
  )
)
if not defined PY (
  python -c "import sys; sys.exit(0 if (3,9) <= sys.version_info[:2] <= (3,12) else 1)" >nul 2>nul && set "PY=python"
)
if not defined PY (
  echo Python 3.9 - 3.12 is required ^(TensorFlow does not support newer versions^).
  echo Install Python 3.11 from https://www.python.org/downloads/ and run this again.
  pause
  exit /b 1
)

REM --- Backend setup (first run only) ---
if not exist "%BACKEND%\venv\Scripts\python.exe" (
  echo Creating Python virtual environment...
  %PY% -m venv "%BACKEND%\venv" || (pause & exit /b 1)
  "%BACKEND%\venv\Scripts\python.exe" -m pip install --upgrade pip
  "%BACKEND%\venv\Scripts\python.exe" -m pip install -r "%BACKEND%\requirements.txt" || (pause & exit /b 1)
)

REM --- Frontend setup (first run only) ---
if not exist "%APP%\node_modules" (
  echo Installing frontend packages...
  pushd "%APP%" & call npm install & popd
)

REM --- Start backend in its own window, frontend in this one ---
echo Starting backend on http://localhost:8000 ...
start "Kiosk Backend" /D "%BACKEND%" cmd /k ""%BACKEND%\venv\Scripts\python.exe" -m uvicorn main:app --port 8000"

echo Starting frontend on http://localhost:3000 ...
pushd "%APP%"
call npm start
popd
