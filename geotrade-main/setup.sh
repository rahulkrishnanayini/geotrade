#!/bin/bash
# GeoTrade Setup Script — Mac/Linux
# Run: bash setup.sh

set -e
echo ""
echo "🌍 GeoTrade Setup"
echo "=================="

# Backend
echo ""
echo "📦 Setting up backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt --quiet
echo "✅ Backend ready"
deactivate
cd ..

# Frontend
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install --silent
echo "✅ Frontend ready"
cd ..

echo ""
echo "🚀 Setup complete! Run these in two separate terminals:"
echo ""
echo "  Terminal 1 (backend):"
echo "    cd backend && source venv/bin/activate && python app.py"
echo ""
echo "  Terminal 2 (frontend):"
echo "    cd frontend && npm run dev"
echo ""
echo "  Then open: http://localhost:3000"
echo ""
