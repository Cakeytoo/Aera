@echo off
echo Starting Aera AI Assistant...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.

REM Start the backend server
echo Starting backend server...
cd Backend
start "Aera Backend" cmd /k "node server.js"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start the React frontend
echo Starting frontend...
cd ..\React
start "Aera Frontend" cmd /k "npm run dev"

echo.
echo ✅ Aera is starting up!
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173 (or check the React terminal)
echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
pause