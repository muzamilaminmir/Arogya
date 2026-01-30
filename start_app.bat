@echo off
echo ==========================================
echo   Government Hospital System - Launcher
echo ==========================================

echo.
echo [1/2] Starting Backend Server (Port 3000)...
start "Hospital Backend" cmd /k "cd server && node src/server.js"

echo.
echo [2/2] Starting Frontend Client (Port 5173)...
start "Hospital Frontend" cmd /k "cd client && npm run dev"

echo.
echo ==========================================
echo   System Started Successfully!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3000
echo ==========================================
echo.
pause
