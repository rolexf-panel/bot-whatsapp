# AUTO_UPDATE.md

## Purpose
This document describes the auto‑update design, security requirements, release packaging expectations, and operational procedures for safely updating the WhatsApp Companion Bot from GitHub Releases. Follow these steps to ensure updates are applied atomically, verified cryptographically, and recoverable.

---

## High‑level design
1. **Release publishing**  
   - Developers publish a GitHub Release tagged with the channel name (for example `v1.2.3-stable`) or include the channel keyword in the tag.  
   - Each release must include a signed `.zip` artifact containing the built application and a corresponding checksum file (SHA‑256) and optional GPG signature file.

2. **Updater agent**  
   - A lightweight updater process runs alongside the application (as a separate PM2/systemd service).  
   - The updater polls GitHub Releases for tags that match the configured `UPDATER_CHANNEL` (for example `stable`) at a configurable interval.  
   - When a new release is detected, the updater downloads the release assets, verifies integrity and authenticity, performs an atomic swap of the application directory, and restarts the application process.

3. **Verification and safety**  
   - The updater verifies the downloaded `.zip` against the provided `.sha256` checksum and, if available, verifies the GPG signature.  
   - The updater performs the update in a temporary directory and only replaces the live directory after all checks pass.  
   - If verification or deployment fails, the updater aborts and leaves the running application untouched.

---

## Release artifact requirements
Each release intended for automatic deployment must include the following assets:

- **Application archive**: `app-<version>.zip`  
  - Contains the production build of `server/` and `client/` (or a single packaged artifact for your deployment model).  
  - The archive should not include development-only files (node_modules can be omitted if the release includes a build step on the server).

- **Checksum file**: `app-<version>.zip.sha256`  
  - Contains the SHA‑256 checksum of the `.zip` file in plain text. Example content:
    ```
    <sha256sum>  app-1.2.3.zip
    ```

- **Signature file (strongly recommended)**: `app-<version>.zip.sig` or `app-<version>.zip.asc`  
  - GPG signature of the `.zip` file created by a trusted release key.

- **Release notes** (optional but recommended)  
  - Short notes describing changes, breaking changes, and any manual steps required after update.

---

## Updater behavior and workflow
1. **Configuration**
   - Environment variables:
     - `GITHUB_REPO` (owner/repo)  
     - `GITHUB_TOKEN` (read‑only token recommended)  
     - `UPDATER_CHANNEL` (e.g., `stable`)  
     - `UPDATER_ENABLED` (`true`/`false`)  
     - `UPDATE_CHECK_INTERVAL` (milliseconds; default 5 minutes)  
     - `APP_DIR` (path to current production app)  
     - `TMP_DIR` (path for temporary downloads)  
     - `GPG_PUBLIC_KEY` (optional; path or key id for signature verification)

2. **Polling and detection**
   - Updater polls GitHub Releases and filters releases whose tag or release name contains `UPDATER_CHANNEL`.  
   - If a newer release is found (by tag or published date) and it has the required assets, the updater proceeds to download.

3. **Download**
   - Download the `.zip` asset and the `.sha256` checksum file (and signature if present) to `TMP_DIR`.  
   - Use authenticated requests when `GITHUB_TOKEN` is provided.

4. **Verification**
   - Compute SHA‑256 of the downloaded `.zip` and compare to the `.sha256` file. If mismatch, abort.  
   - If a GPG signature is provided and a trusted public key is configured, verify the signature. If verification fails, abort.  
   - Log verification results and alert on failures.

5. **Staging**
   - Unzip the artifact into a new staging directory (for example `APP_DIR_new`).  
   - Run any post‑unpack checks (file permissions, presence of expected files, optional smoke tests).

6. **Atomic swap**
   - If all checks pass, perform an atomic swap:
     - Move `APP_DIR` to `APP_DIR_old` (or rename), move `APP_DIR_new` to `APP_DIR`.  
     - Ensure file ownership and permissions are correct for the service user.  
   - Restart the application process via PM2/systemd.

7. **Rollback**
   - If the new process fails health checks after restart, automatically rollback:
     - Move `APP_DIR` back from `APP_DIR_old` and restart the previous process.  
     - Preserve logs and error artifacts for investigation.  
   - After a successful update and a configurable grace period, remove `APP_DIR_old`.

8. **Notifications and logging**
   - Emit structured logs for each step (download, verify, stage, swap, restart).  
   - Optionally send notifications (webhook, email, or chat) on success or failure.

---

## Security controls
- **Least privilege GitHub token**: use a token with minimal scopes (repo:read or equivalent). Rotate regularly.  
- **Checksum verification**: mandatory SHA‑256 verification before applying updates.  
- **Signature verification**: strongly recommended. Configure the updater with the release signing public key and verify GPG signatures.  
- **Run updater as non‑privileged user**: the updater should only have write access to the application directory and restart privileges for the service.  
- **Atomic operations**: use rename/move operations for atomic swaps to avoid partial deployments.  
- **Immutable backups**: keep the previous release directory for quick rollback; do not overwrite it until the update is validated.  
- **Network restrictions**: restrict outbound access for the updater to GitHub API endpoints only where possible.

---

## Health checks and smoke tests
- Implement a minimal health endpoint (for example `/healthz`) that returns success only when the application is ready.  
- After restart, the updater should poll the health endpoint for a configurable timeout (for example 60 seconds).  
- Optionally run a small set of smoke tests (send a test command to the bot and verify expected response) before marking the update as successful.

---

## Failure modes and recovery
- **Checksum/signature mismatch**: abort and alert; do not apply the update.  
- **Staging errors (unzip, missing files)**: abort and keep current app running. Preserve staging artifacts for debugging.  
- **Restart failure**: attempt rollback to previous directory and restart. If rollback fails, escalate and alert operators.  
- **Partial update due to disk space**: detect low disk space before download; abort if insufficient.  
- **Network errors**: implement retries with exponential backoff for downloads; abort after a safe threshold.

---

## Operational recommendations
- **Release cadence**: publish to a `stable` channel only after testing in a `canary` or `beta` channel. Use separate tags or naming conventions.  
- **CI/CD**: automate build, packaging, checksum generation, and signing via GitHub Actions. The workflow should:
  - Build server and client artifacts
  - Create a `.zip` release artifact
  - Compute SHA‑256 checksum and attach as an asset
  - Sign the artifact with a GPG key and attach the signature
  - Create a GitHub Release with the channel tag (for example `v1.2.3-stable`)
- **Testing updates**: test the updater in a staging environment before enabling it in production.  
- **Monitoring**: monitor update attempts, failures, and rollbacks. Create alerts for repeated failures or unexpected rollbacks.  
- **Audit trail**: keep a record of applied updates, who published the release, and the release notes for traceability.

---

## Example minimal updater checklist
- [ ] `GITHUB_REPO` and `GITHUB_TOKEN` configured  
- [ ] `UPDATER_CHANNEL` set to the intended channel (e.g., `stable`)  
- [ ] `APP_DIR`, `TMP_DIR` configured and writable by updater user  
- [ ] Health endpoint implemented and reachable  
- [ ] Releases include `.zip` and `.sha256` (and `.sig` if using GPG)  
- [ ] PM2/systemd configured to restart the application after swap  
- [ ] Logging and notification hooks configured

---

## Example GitHub Actions hints
- Build server and client artifacts in a workflow job.  
- Create a release artifact `.zip` containing only production files.  
- Compute SHA‑256 and attach as `app-<version>.zip.sha256`.  
- Sign the artifact with a GPG key and attach the signature file.  
- Create the GitHub Release with a tag that includes the channel keyword (for example `v1.2.3-stable`).

---

## Final notes
- The updater is a powerful convenience but also a supply‑chain risk if misconfigured. Enforce cryptographic verification, least privilege, and robust rollback behavior.  
- Start with `UPDATER_ENABLED=false` in production until you have validated the full release and verification pipeline in a staging environment.  
- Maintain clear operational runbooks for manual intervention and emergency rollback procedures.
