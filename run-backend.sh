#!/bin/bash

# Run Backend Script
# Starts the Python FastAPI backend server

echo "=========================================="
echo "Starting SoC Simulator Backend"
echo "=========================================="

cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Run the backend
echo ""
echo "Starting FastAPI backend on http://localhost:8000"
echo "WebSocket endpoint: ws://localhost:8000/ws"
echo "API docs: http://localhost:8000/docs"
echo ""

python main.py
