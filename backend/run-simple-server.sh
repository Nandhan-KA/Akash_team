#!/bin/bash
echo "Starting Simple Phone Detection Server..."
cd "$(dirname "$0")"
cp simple-package.json package.json
npm install
echo "Installing dependencies complete. Starting server..."
node simple-server.js 