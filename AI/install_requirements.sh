#!/bin/bash

echo "Installing Python requirements for Aera AI..."
echo

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Try different Python commands
if command_exists python3; then
    echo "Using python3 command..."
    python3 -m pip install --upgrade pip
    python3 -m pip install -r requirements.txt
elif command_exists python; then
    echo "Using python command..."
    python -m pip install --upgrade pip
    python -m pip install -r requirements.txt
else
    echo "ERROR: No Python installation found!"
    echo "Please install Python from https://python.org"
    echo "On Ubuntu/Debian: sudo apt install python3 python3-pip"
    echo "On macOS: brew install python3"
    exit 1
fi

echo
echo "Installation complete!"
echo "You can now test the AI integration by running: node ../Backend/test_ai.js"