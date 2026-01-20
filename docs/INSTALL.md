# INSTALL.md

## Overview
This document explains how to set up and run the WhatsApp Companion Bot for development and production. Follow the steps in order for a smooth setup and secure deployment.

---

## Prerequisites
- **Node.js** v18 or later  
- **npm** (or pnpm)  
- **PM2** (recommended for production)  
- **pinggy CLI** (optional, for temporary public tunnel during pairing)  
- A **GitHub token** with read access to the repository (for the auto‑update agent)

---

## Repository layout (expected)
```
server/        # backend (Express, session manager, updater)
client/        # frontend (React + Vite)
pm2.config.js  # PM2 process configuration
scripts/       # helper scripts (tunnel, setup)
docs/          # optional documentation
```

---

## Environment configuration
1. Copy example env files:
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```
2. Edit `server/.env` and set the required values:
- `PORT` (e.g., `3000`)  
- `PINGGY_TOKEN` (optional)  
- `GITHUB_REPO` (e.g., `rolexf-panel/bot-whatsapp`)  
- `GITHUB_TOKEN` (read-only recommended)  
- `UPDATER_CHANNEL` (e.g., `stable`)  
- `UPDATER_ENABLED` (`true` or `false`)  
- `SESSION_SECRET` (strong random string)  
- `BASIC_AUTH_USER` and `BASIC_AUTH_PASS` (pairing UI credentials)  
- `ENCRYPTION_KEY` (32 bytes, base64)  
- `NODE_ENV` (`development` or `production`)

3. Generate a secure `ENCRYPTION_KEY`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Copy the output into `ENCRYPTION_KEY`.

---

## Install dependencies
1. Backend:
```bash
cd server
npm ci
```
2. Frontend:
```bash
cd ../client
npm ci
```

---

## Development run
1. Start the backend:
```bash
cd server
npm run dev
```
2. Start the frontend:
```bash
cd client
npm run dev
```
3. (Optional) Start a Pinggy tunnel for public pairing:
```bash
cd server
npm run tunnel
```
4. Open the pairing UI:
- Local dev UI: `http://localhost:5173`  
- If using Pinggy: open the Pinggy URL and navigate to `/pair`  
- Authenticate with Basic Auth and scan the QR code with WhatsApp

---

## Session persistence
- After successful pairing, the session is saved encrypted under `server/data/` (or configured path).  
- Keep `ENCRYPTION_KEY` secret and back up the encrypted session file if needed.

---

## Production deployment
1. Configure a domain and TLS (recommended). Use a reverse proxy (Nginx) if desired.  
2. Start services with PM2:
```bash
pm2 start pm2.config.js
pm2 save
```
3. Ensure environment variables are set in the production environment (systemd, Docker, or PM2 ecosystem).

---

## Auto‑Update (brief)
- The updater polls GitHub Releases for tags that include the value of `UPDATER_CHANNEL` (e.g., `stable`).  
- Release artifacts must include:
  - A `.zip` archive of the release
  - A `.sha256` checksum file and/or a GPG signature file
- Update flow:
  1. Download `.zip` asset
  2. Verify checksum and/or signature
  3. Unzip to a new directory
  4. Atomically swap the production directory
  5. Restart processes via PM2
- Recommendation: use GitHub Actions to build, sign, and publish releases automatically.

---

## Security and hardening
- Keep `ENCRYPTION_KEY`, `GITHUB_TOKEN`, and `BASIC_AUTH_*` confidential.  
- Protect the pairing page with Basic Auth and optional IP whitelist.  
- Disable the Pinggy tunnel after pairing in production.  
- Serve all public endpoints over HTTPS.  
- Use firewall rules to restrict access to management ports.  
- Sign release artifacts and include checksums for updater verification.

---

## Troubleshooting
- **No QR appears**: confirm the backend is running and `socket.io` connections are established; check server logs for `qr` events.  
- **Auth failure**: remove local session files and re-pair; verify `ENCRYPTION_KEY` matches the key used to encrypt session files.  
- **Updater not detecting releases**: ensure releases include the `UPDATER_CHANNEL` tag and contain a `.zip` asset; verify `GITHUB_TOKEN` has read access.  
- **Puppeteer/Chromium issues**: ensure system dependencies for headless Chromium are installed; use `--no-sandbox` only when necessary and understand the security implications.

---

## Useful commands
- Start backend (dev):
```bash
cd server && npm run dev
```
- Start frontend (dev):
```bash
cd client && npm run dev
```
- Start Pinggy tunnel:
```bash
cd server && npm run tunnel
```
- Start production with PM2:
```bash
pm2 start pm2.config.js
pm2 save
```

---

## Next steps
- After pairing, test basic commands from WhatsApp such as `!ping` and `!welcome`.  
- Create a GitHub Actions workflow to build, package, checksum, and sign releases for the updater.  
- Review `SECURITY.md` (if present) and adapt hardening steps to your environment.
