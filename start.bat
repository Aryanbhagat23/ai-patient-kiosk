@echo off
REM One-command launcher for Windows.
REM   start.bat       build the app (when changed) and serve everything on http://localhost:8000
REM   start.bat dev   developer mode: backend on :8000 plus the React dev server on :3000
setlocal
set "ROOT=%~dp0"
set "APP=%ROOT%patient-checkin-system"
set "BACKEND=%APP%\backend"
set "MODE=%~1"

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

REM --- Backend setup (first run, or whenever requirements.txt changes) ---
if exist "%BACKEND%\venv" (
  fc /b "%BACKEND%\requirements.txt" "%BACKEND%\venv\requirements.installed" >nul 2>nul || (
    echo requirements.txt changed, rebuilding the Python environment...
    rmdir /s /q "%BACKEND%\venv"
  )
)
if not exist "%BACKEND%\venv\Scripts\python.exe" (
  echo Creating Python virtual environment...
  %PY% -m venv "%BACKEND%\venv" || (pause & exit /b 1)
  "%BACKEND%\venv\Scripts\python.exe" -m pip install --upgrade pip
  "%BACKEND%\venv\Scripts\python.exe" -m pip install -r "%BACKEND%\requirements.txt" || (pause & exit /b 1)
  copy /y "%BACKEND%\requirements.txt" "%BACKEND%\venv\requirements.installed" >nul
)

REM --- Frontend packages (first run, or whenever package-lock.json changes) ---
fc /b "%APP%\package-lock.json" "%APP%\node_modules\.installed-lock" >nul 2>nul || (
  echo Installing frontend packages...
  pushd "%APP%"
  call npm install || (popd & pause & exit /b 1)
  popd
  copy /y "%APP%\package-lock.json" "%APP%\node_modules\.installed-lock" >nul
)

if /i "%MODE%"=="dev" goto dev

REM --- Build the app when the source changed since the last build ---
powershell -NoProfile -Command "$b = Get-Item '%APP%\build\index.html' -ErrorAction SilentlyContinue; if (-not $b) { exit 1 }; $n = Get-ChildItem '%APP%\src','%APP%\public','%APP%\package.json' -Recurse -File | Where-Object { $_.LastWriteTime -gt $b.LastWriteTime }; if ($n) { exit 1 } else { exit 0 }"
if errorlevel 1 (
  echo Building the app ^(about a minute^)...
  pushd "%APP%"
  call npm run build || (popd & pause & exit /b 1)
  popd
)

REM --- Open the browser once the server answers, then run the server in this window ---
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "for ($i = 0; $i -lt 120; $i++) { try { Invoke-WebRequest -UseBasicParsing http://localhost:8000/api/v1/health | Out-Null; Start-Process 'http://localhost:8000'; break } catch { Start-Sleep 1 } }"
echo.
echo Starting on http://localhost:8000  (close this window or press Ctrl+C to stop)
cd /d "%BACKEND%"
"%BACKEND%\venv\Scripts\python.exe" -m uvicorn main:app --host 127.0.0.1 --port 8000
pause
exit /b 0

:dev
echo Starting backend on http://localhost:8000 ...
start "Kiosk Backend" /D "%BACKEND%" cmd /k ""%BACKEND%\venv\Scripts\python.exe" -m uvicorn main:app --port 8000 --reload"
echo Starting frontend dev server on http://localhost:3000 ...
pushd "%APP%"
call npm start
popd
