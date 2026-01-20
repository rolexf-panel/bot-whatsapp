# WhatsApp Companion Bot

Repo starter untuk WhatsApp Companion Bot — pairing QR via web, dashboard, dan auto-update dari GitHub Releases.

## Quick start (dev)
1. Copy env: `cp server/.env.example server/.env` and edit.
2. Install:
   - `cd server && npm ci`
   - `cd ../client && npm ci`
3. Run server: `cd server && npm run dev`
4. Run client: `cd client && npm run dev`
5. (Optional) Start Pinggy tunnel: `cd server && npm run tunnel`

## Production
- Setup domain + TLS, PM2, dan environment variables.
- Start with `pm2 start pm2.config.js`.

Lihat `docs/INSTALL.md` untuk panduan lengkap.
