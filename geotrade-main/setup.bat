@echo off
echo.
echo  GeoTrade Setup - Windows
echo ==========================

echo.
echo [1/2] Setting up backend...
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt --quiet
echo  Backend ready
call deactivate
cd ..

echo.
echo [2/2] Installing frontend...
cd frontend
npm install --silent
echo  Frontend ready
cd ..

echo.
echo  Setup complete! Open TWO Command Prompt windows and run:
echo.
echo   Window 1 (backend):
echo     cd backend
echo     venv\Scripts\activate
echo     python app.py
echo.
echo   Window 2 (frontend):
echo     cd frontend
echo     npm run dev
echo.
echo   Then open: http://localhost:3000
echo.
pause
