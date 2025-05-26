@echo off
echo Starting servers...

:: Start the backend server in a new window
start "Backend Server" cmd /k "cd backend\py_backend\Scripts && Activate.bat && cd .. && cd .. && python app.py"

:: Wait for backend to initialize
timeout /t 5 /nobreak

:: Start the frontend in a new window
start "Frontend Server" cmd /k "npm run dev"

echo Both servers should now be running!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000 