# Start the Python backend server in a new window
Start-Process powershell -ArgumentList @"
cd '$pwd\backend\py_backend\Scripts'
.\Activate.ps1
cd ..
cd ..
python app.py
"@

# Wait a bit for the backend to initialize
Write-Host "Starting backend server..."
Start-Sleep -Seconds 5

# Start the frontend in a new window
Start-Process powershell -ArgumentList @"
cd '$pwd'
npm run dev
"@

Write-Host "Starting frontend server..."
Write-Host "Both servers should now be running!"
Write-Host "Backend: http://localhost:5000"
Write-Host "Frontend: http://localhost:3000" 