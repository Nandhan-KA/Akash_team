@echo off
echo Starting Simple Phone Detection Server...
cd %~dp0
copy simple-package.json package.json
npm install
echo Installing dependencies complete. Starting server...
node simple-server.js 