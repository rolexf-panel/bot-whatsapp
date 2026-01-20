import crypto from 'crypto';
import fs from 'fs';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey() {
  const b64 = process.env.ENCRYPTION_KEY || '';
  if (!b64) throw new Error('ENCRYPTION_KEY not set');
  const key = Buffer.from(b64, 'base64');
  if (key.length !== 32) throw new Error('ENCRYPTION_KEY must be 32 bytes (base64)');
  return key;
}

export function encryptSession(obj) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: TAG_LEN });
  const plaintext = Buffer.from(JSON.stringify(obj), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]).toString('base64');
  return payload;
}

export function decryptSession(payloadB64) {
  const key = getKey();
  const payload = Buffer.from(payloadB64, 'base64');
  const iv = payload.slice(0, IV_LEN);
  const tag = payload.slice(IV_LEN, IV_LEN + TAG_LEN);
  const encrypted = payload.slice(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, key, iv, { authTagLength: TAG_LEN });
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

export function saveEncryptedSession(path, obj) {
  const payload = encryptSession(obj);
  fs.writeFileSync(path, payload, { encoding: 'utf8', mode: 0o600 });
}

export function loadEncryptedSession(path) {
  if (!fs.existsSync(path)) return null;
  const payload = fs.readFileSync(path, 'utf8');
  return decryptSession(payload);
}
