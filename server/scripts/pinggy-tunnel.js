#!/usr/bin/env node
/**
 * Simple Pinggy tunnel launcher script.
 * Requires PINGGY_TOKEN in env or passed as first arg.
 * This script shells out to pinggy CLI. Ensure pinggy CLI is installed.
 *
 * Usage:
 *   node scripts/pinggy-tunnel.js
 *   PINGGY_TOKEN=xxx node scripts/pinggy-tunnel.js
 */

import { spawn } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.PINGGY_TOKEN || process.argv[2];
if (!token) {
  console.error('PINGGY_TOKEN not set. Provide via env or first arg.');
  process.exit(1);
}

const subdomain = process.env.PINGGY_SUBDOMAIN || '';
const args = ['tunnel', '--token', token, '--port', process.env.PORT || '3000'];
if (subdomain) args.push('--subdomain', subdomain);

console.log('Starting Pinggy tunnel with args:', args.join(' '));
const p = spawn('pinggy', args, { stdio: 'inherit' });

p.on('close', code => {
  console.log('Pinggy process exited with', code);
  process.exit(code);
});
