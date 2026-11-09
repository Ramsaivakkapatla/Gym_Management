Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  IRONPULSE Gym Membership Management System" -ForegroundColor Green
Write-Host "  Starting Backend (Port 4000) and Frontend (Port 5173)..." -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Cyan

$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = Join-Path $PSScriptRoot "frontend"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"

Write-Host "`nBackend and Frontend have been launched in separate windows!" -ForegroundColor Green
Write-Host "Open your browser at: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Admin Login: admin@gym.com / admin123" -ForegroundColor Yellow
