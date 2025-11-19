@echo off
echo Installing Python requirements for Aera AI...
echo.

REM Try different Python commands
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Using python command...
    python -m pip install --upgrade pip
    python -m pip install -r requirements.txt
    goto :end
)

python3 --version >nul 2>&1
if %errorlevel% == 0 (
    echo Using python3 command...
    python3 -m pip install --upgrade pip
    python3 -m pip install -r requirements.txt
    goto :end
)

py --version >nul 2>&1
if %errorlevel% == 0 (
    echo Using py command...
    py -m pip install --upgrade pip
    py -m pip install -r requirements.txt
    goto :end
)

echo ERROR: No Python installation found!
echo Please install Python from https://python.org
echo Make sure to add Python to your PATH during installation.
pause
exit /b 1

:end
echo.
echo Installation complete!
echo You can now test the AI integration by running: node ../Backend/test_ai.js
pause