@echo off
echo Installing Python dependencies for Aera AI...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

REM Install pip if not available
python -m pip --version >nul 2>&1
if errorlevel 1 (
    echo Installing pip...
    python -m ensurepip --upgrade
)

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install requirements
echo Installing llama-cpp-python...
python -m pip install llama-cpp-python==0.2.11

echo Installing numpy...
python -m pip install numpy>=1.21.0

echo.
echo Installation complete!
echo.
echo Next steps:
echo 1. Download a GGUF model file (e.g., Llama 3.1)
echo 2. Place it in the 'models' folder as 'llama3.1.gguf'
echo 3. Run start_aera.bat to start the application
echo.
pause