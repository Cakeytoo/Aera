#!/bin/bash

echo "Installing Python dependencies for Aera AI..."
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    echo "Please install Python 3.8+ from your package manager"
    exit 1
fi

# Check Python version
python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
required_version="3.8"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "Error: Python $python_version found, but Python $required_version+ is required"
    exit 1
fi

# Upgrade pip
echo "Upgrading pip..."
python3 -m pip install --upgrade pip

# Install requirements
echo "Installing llama-cpp-python..."
python3 -m pip install llama-cpp-python==0.2.11

echo "Installing numpy..."
python3 -m pip install "numpy>=1.21.0"

echo
echo "Installation complete!"
echo
echo "Next steps:"
echo "1. Download a GGUF model file (e.g., Llama 3.1)"
echo "2. Place it in the 'models' folder as 'llama3.1.gguf'"
echo "3. Run ./start_aera.sh to start the application"
echo