# Quick Start Guide

Get the SoC Simulator running in 5 minutes!

## Prerequisites Check

```bash
# Check Python (need 3.8+)
python3 --version

# Check Node.js (need 16+)
node --version
npm --version
```

## Installation (One-Time Setup)

```bash
# 1. Install Backend Dependencies
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..

# 2. Install Frontend Dependencies
cd frontend
npm install
cd ..
```

## Running the Application

### Method 1: Using Scripts (Easy!)

**Terminal 1:**
```bash
./run-backend.sh
```

**Terminal 2:**
```bash
./run-frontend.sh
```

### Method 2: Manual

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run electron:dev
```

## First Steps

1. **Wait for Connection**: Look for the green "Connected" indicator
2. **Add ARM CPU**: Click "🔲 ARM CPU" button
3. **Add DDR Memory**: Click "💾 DDR Memory" button
4. **Connect Them**: Drag from one component's handle to another
5. **Start Simulation**: Click "▶️ Start Simulation"
6. **Watch Logs**: See real-time activity in the Logs Panel!

## Common Issues

### "Not connected to backend"
→ Make sure backend is running on port 8000

### "ModuleNotFoundError"
→ Activate virtual environment: `source backend/venv/bin/activate`

### Blank Electron window
→ Check if frontend dev server is on port 5173

### Port already in use
→ Kill existing process or change port in `backend/main.py`

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Try different component configurations
- Experiment with multiple components and connections
- Monitor simulation metrics in the logs

## URLs to Remember

- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- WebSocket: ws://localhost:8000/ws
- Frontend Dev: http://localhost:5173

Happy Simulating! 🚀
