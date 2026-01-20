#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "Installing server dependencies..."
cd server
npm ci

echo "Installing client dependencies..."
cd ../client
npm ci

echo "Creating .env from example if missing..."
cd ../server
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Please edit server/.env and set ENCRYPTION_KEY, GITHUB_TOKEN, PINGGY_TOKEN, BASIC_AUTH_*"
fi

echo "Setup complete. To run dev server:"
echo "  cd server && npm run dev"
echo "To run client dev:"
echo "  cd client && npm run dev"
