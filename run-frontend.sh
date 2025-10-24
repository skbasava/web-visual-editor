#!/bin/bash

# Run Frontend Script
# Starts the Electron application with React dev server

echo "=========================================="
echo "Starting SoC Simulator Frontend"
echo "=========================================="

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

# Run Electron in dev mode
echo ""
echo "Starting Electron application..."
echo "Make sure the backend is running on port 8000!"
echo ""

npm run electron:dev
