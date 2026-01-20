# SECURITY.md

## Purpose
This document describes recommended security practices, hardening steps, and operational controls for the WhatsApp Companion Bot. Follow these guidelines to reduce risk during development, pairing, and production operation.

---

## Secrets and Credentials
- **Keep secrets out of source control.** Never commit `ENCRYPTION_KEY`, `GITHUB_TOKEN`, `BASIC_AUTH_*`, or other credentials to the repository.
- **Use environment variables or a secrets manager** (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault) for production secrets.
- **Least privilege:** grant the GitHub token only the minimum scopes required (read-only for releases). Use short‑lived credentials where possible.
- **Rotate secrets regularly** and immediately rotate any secret that may have been exposed.

---

## Session Security
- **Encrypt session files at rest.** Use AES‑256‑GCM (or equivalent) with a 32‑byte key stored securely in environment variables or a secrets manager.
- **Protect session keys.** `ENCRYPTION_KEY` must be treated as a high‑value secret and rotated if compromised.
- **File permissions.** Store session files with restrictive file permissions (e.g., `600`) and limit access to the service account only.
- **Backup policy.** If you back up encrypted session files, ensure backups are encrypted and access‑controlled.

---

## Network and Access Controls
- **Pairing UI protection.** Restrict access to the pairing page with Basic Auth and, where possible, IP allowlists or VPN access during initial pairing.
- **Disable public tunnels in production.** Use Pinggy or similar only for temporary setup. Disable or remove tunnels after pairing is complete.
- **Use HTTPS/TLS.** Terminate TLS at a trusted reverse proxy (Nginx, Cloud Load Balancer) or enable TLS directly in the app. Redirect all HTTP to HTTPS.
- **Firewall rules.** Restrict inbound access to management ports and the server to only required IP ranges.
- **Network segmentation.** Run the bot in a segmented network or VPC with limited outbound access to only required endpoints (GitHub API, optional webhook targets).

---

## Webhooks and API Security
- **Verify incoming webhooks.** Validate webhook payloads using HMAC signatures or other verification mechanisms. Reject requests that fail verification.
- **Rate limiting and throttling.** Apply rate limits on public endpoints and webhook handlers to mitigate abuse and DoS attempts.
- **Input validation.** Validate and sanitize all incoming data before processing or logging.
- **Authentication for admin APIs.** Protect any administrative or management endpoints with strong authentication and authorization.

---

## Process and Runtime Hardening
- **Run as non‑root.** Execute the application under a dedicated, non‑privileged user account.
- **Use process manager.** Use PM2, systemd, or container orchestration for supervised restarts and controlled restarts during updates.
- **Resource limits.** Apply ulimits or container resource limits to prevent resource exhaustion.
- **Disable unnecessary features.** Remove or disable debug endpoints, verbose stack traces, and developer tools in production.

---

## Updater and Supply Chain Security
- **Signed releases and checksums.** Publish release artifacts with a cryptographic checksum (SHA‑256) and a GPG signature. The updater must verify both before applying updates.
- **Least privilege for updater.** The updater should run with minimal privileges and only be able to write to the application directory and restart the service.
- **Atomic updates.** Use atomic swap patterns (unzip to a new directory, verify, then move) to avoid partial updates.
- **Audit GitHub tokens.** Use a dedicated token for the updater with read‑only access and rotate it regularly.

---

## Logging and Monitoring
- **Structured logs.** Use structured logging (JSON) and include correlation IDs for tracing user actions and updates.
- **Sensitive data redaction.** Never log secrets, tokens, or full session payloads. Mask or redact sensitive fields.
- **Centralized logging and alerting.** Forward logs to a centralized system (ELK, Datadog, Azure Monitor) and configure alerts for auth failures, repeated errors, or suspicious activity.
- **Health checks and metrics.** Expose a minimal `/healthz` endpoint for liveness checks and monitor key metrics (uptime, reconnects, message errors).

---

## Incident Response
- **Revoke and rotate.** If a secret or session is suspected compromised, immediately revoke the secret, rotate keys, and force re‑pairing (delete session files).
- **Containment.** Isolate affected hosts and revoke network access while investigating.
- **Forensic logging.** Preserve logs and relevant artifacts for investigation. Do not overwrite logs during incident handling.
- **Post‑incident review.** Conduct a root cause analysis and update procedures and automation to prevent recurrence.

---

## Development Best Practices
- **Dependency management.** Keep dependencies up to date and monitor for vulnerabilities (Dependabot, Snyk). Avoid deprecated or unmaintained packages.
- **Static analysis and linting.** Use linters and static analysis tools to catch common security issues early.
- **Code reviews.** Require peer review for changes to security‑sensitive code (session handling, updater, auth).
- **Secrets scanning.** Use automated scanning to detect accidental secret commits.

---

## Operational Recommendations
- **Backup and recovery.** Maintain encrypted backups of critical configuration and encrypted session files. Test recovery procedures regularly.
- **Access control.** Use role‑based access control for servers, CI/CD, and GitHub. Limit who can publish releases to the `stable` channel.
- **Periodic audits.** Schedule periodic security reviews and penetration tests for the deployment environment.
- **Documentation.** Keep this SECURITY.md and operational runbooks up to date and accessible to the operations team.

---

## Quick checklist before production
- [ ] `ENCRYPTION_KEY` stored securely and not in repo  
- [ ] Pairing UI protected and tunnel disabled after pairing  
- [ ] TLS enabled for all public endpoints  
- [ ] Releases signed and checksums published for updater  
- [ ] PM2/systemd configured with non‑root user and health checks  
- [ ] Centralized logging and alerting configured  
- [ ] Secrets rotated and least privilege enforced

---

## Contact and reporting
If you discover a security issue or vulnerability, follow your organization’s incident reporting process. For public disclosures, provide clear reproduction steps, affected versions, and suggested mitigations.
