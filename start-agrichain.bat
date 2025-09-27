@echo off
echo Starting AgriChain Project...
echo.

echo Step 1: Starting Ganache blockchain...
start "Ganache" cmd /k "npx ganache-cli --port 7545 --deterministic --networkId 1758097798747"

echo Waiting for Ganache to start...
timeout /t 5 /nobreak > nul

echo Step 2: Deploying smart contracts...
npx truffle migrate --reset

echo Step 3: Creating sample data...
node fix-item-tracking.js

echo Step 4: Starting backend server...
start "Backend Server" cmd /k "node server/index.js"

echo Waiting for server to start...
timeout /t 3 /nobreak > nul

echo Step 5: Starting React frontend...
start "React Frontend" cmd /k "cd client && npm start"

echo.
echo ✅ AgriChain is starting up!
echo 🌐 Frontend will open at: http://localhost:3000
echo 🔗 Backend API: http://localhost:5000
echo ⛓️ Blockchain: http://127.0.0.1:7545
echo.
echo Press any key to exit this window...
pause > nul

