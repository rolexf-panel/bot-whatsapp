docs/INSTALL.md
md
# INSTALL Guide

## Prerequisites
- Node.js >= 18
- npm
- PM2 (for production)
- pinggy CLI (optional for tunnel)
- GitHub token with repo read access (for updater)

## Steps
1. Clone repo
2. Create `.env` in `server/` from `.env.example`
3. Generate `ENCRYPTION_KEY`:
   ```js
   // Node snippet
   console.log(require('crypto').randomBytes(32).toString('base64'));
Paste into ENCRYPTION_KEY.

Install dependencies:

cd server && npm ci

cd client && npm ci

Start dev:

cd server && npm run dev

cd client && npm run dev

Pairing:

Open http://localhost:5173 (or Pinggy URL) → / → scan QR.

Production:

Configure domain + TLS

pm2 start pm2.config.js

---
