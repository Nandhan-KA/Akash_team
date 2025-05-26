Write-Host "Creating virtual environment..."
Set-Location -Path "backend"
python -m venv py_backend

Write-Host "Activating virtual environment..."
& .\py_backend\Scripts\Activate.ps1

Write-Host "Installing dependencies..."
pip install -r requirements.txt

Write-Host "Starting backend server..."
Start-Process -NoNewWindow -FilePath "python" -ArgumentList "app.py"

Write-Host "Starting frontend server..."
Set-Location -Path "..\frontend"
npm run dev
