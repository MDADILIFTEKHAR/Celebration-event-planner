#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "==> Installing Python dependencies..."
pip install -r backend/requirements.txt

# If node and npm are available, build the frontend
if command -v npm &> /dev/null; then
  echo "==> Building frontend with npm..."
  npm --prefix frontend install
  npm --prefix frontend run build
else
  echo "==> npm not found in environment, using bundled production dist in frontend/dist"
fi

echo "==> Build complete."
