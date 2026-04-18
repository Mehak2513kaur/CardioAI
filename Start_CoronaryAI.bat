@echo off
title CoronaryAI Diagnostic System
echo ==========================================
echo 🫀  Starting CoronaryAI Diagnostic System
echo ==========================================

:: Initial checks
if not exist "backend\venv" (
    echo [ERROR] Backend virtual environment not found. 
    echo Please run backend setup first.
    pause
    exit /b
)

:: Start Backend in a new window
echo [SERVER] Launching Backend API on Port 5001...
start "CoronaryAI Backend" cmd /k "cd backend && venv\Scripts\activate && set PORT=5001 && python app.py"

:: Give backend a moment to start
timeout /t 3 /nobreak > nul

:: Start Frontend in a new window
echo [UI] Launching Frontend Dashboard...
start "CoronaryAI Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ==========================================
echo ✅ All systems are launching...
echo 🌍 Once ready, visit: http://localhost:5173
echo ==========================================
pause
