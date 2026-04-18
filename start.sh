#!/bin/bash

# CoronaryAI Startup Script for Mac/Linux
echo "=========================================="
echo "🫀  Starting CoronaryAI Diagnostic System"
echo "=========================================="

# 1. Start Backend in background
echo "[SERVER] Launching Backend API on Port 5001..."
cd backend
source venv/bin/activate
export PORT=5001
python3 app.py &
BACKEND_PID=$!
cd ..

# 2. Wait for backend to initialize
sleep 3

# 3. Start Frontend
echo "[UI] Launching Frontend Dashboard..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=========================================="
echo "✅ All systems are active."
echo "🌍 Dashboard: http://localhost:5173"
echo "📡 Backend: http://localhost:5001"
echo "=========================================="
echo "Press Ctrl+C to stop all services."

# Handle cleanup on Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; echo -e '\n🛑 Services stopped.'; exit" INT TERM
wait
