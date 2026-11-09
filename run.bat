@echo off
title Gym Management System Launcher
echo ===================================================
echo   IRONPULSE Gym Membership Management System
echo   Starting Backend (Port 4000) and Frontend (Port 5173)...
echo ===================================================

start "Gym Backend (Port 4000)" cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 2 /nobreak >nul
start "Gym Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both Backend and Frontend have been started!
echo Open your browser at: http://localhost:5173
echo Admin Login: admin@gym.com / admin123
echo.
pause
