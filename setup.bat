@echo off
REM MEXC Trading Bot Setup Script for Windows

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  MEXC Spot Auto-Trading Bot - Setup Script (Windows)       ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check Python version
echo Checking Python version...
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo Python version: %PYTHON_VERSION%
echo ✓ Python version OK
echo.

REM Create virtual environment
echo Creating virtual environment...
if not exist ".venv" (
    python -m venv .venv
    echo ✓ Virtual environment created
) else (
    echo ✓ Virtual environment already exists
)

REM Activate virtual environment
echo Activating virtual environment...
call .venv\Scripts\activate.bat

echo ✓ Virtual environment activated
echo.

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip setuptools wheel

echo ✓ pip upgraded
echo.

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Install GUI dependencies
echo.
echo Installing GUI dependencies...
pip install kivy kivy-garden
python -m garden install matplotlib

echo ✓ Dependencies installed
echo.

REM Create configuration file
echo Setting up configuration...
if not exist "config.json" (
    python src/main.py --create-config
    echo ✓ Configuration file created at config.json
    echo.
    echo ⚠️  IMPORTANT: Edit config.json and add your MEXC API credentials
) else (
    echo ✓ Configuration file already exists
)

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  Setup Complete!                                           ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Next steps:
echo 1. Edit config.json with your MEXC API key and secret
echo 2. Run GUI mode: python src/main.py --gui
echo 3. Or run CLI mode: python src/main.py --cli
echo 4. Or run test mode: python src/main.py --test
echo.
echo For help: python src/main.py --help
echo.
pause
