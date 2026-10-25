#!/bin/bash
set -e

echo "=========================================================="
echo " Starting TeXCraft Studio (Overleaf LaTeX Resume Builder) "
echo "=========================================================="

# 1. Start FastAPI Backend
echo "Starting Python FastAPI Backend on http://localhost:8000..."
cd "$(dirname "$0")"
source backend/venv/bin/activate
export PYTHONPATH=.
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Trap signals to clean up background processes
trap "echo 'Shutting down services...'; kill $BACKEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM EXIT

# 2. Start Next.js Frontend
echo "Starting Next.js Frontend on http://localhost:3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=========================================================="
echo " TeXCraft Studio is live!"
echo " Web UI:  http://localhost:3000"
echo " Backend: http://localhost:8000"
echo " API Docs: http://localhost:8000/docs"
echo "=========================================================="
echo ""

wait
