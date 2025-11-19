#!/bin/bash

echo "Starting Aera AI Assistant..."
echo

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Node.js is installed
if ! command_exists node; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org"
    echo "On Ubuntu/Debian: sudo apt install nodejs npm"
    echo "On macOS: brew install node"
    exit 1
fi

echo "✅ Node.js found"
echo

# Start the backend server in background
echo "Starting backend server..."
cd Backend
node server.js &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start the React frontend in background
echo "Starting frontend..."
cd ../React
npm run dev &
FRONTEND_PID=$!

echo
echo "✅ Aera is starting up!"
echo
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:5173 (or check the terminal output above)"
echo
echo "Press Ctrl+C to stop both servers"
echo

# Function to cleanup on exit
cleanup() {
    echo
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup INT TERM

# Wait for user to stop
wait