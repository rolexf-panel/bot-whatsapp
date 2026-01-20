import axios from 'axios';
import fs from 'fs';
import { exec } from 'child_process';
import crypto from 'crypto';
const REPO = process.env.GITHUB_REPO;
const TOKEN = process.env.GITHUB_TOKEN;
const CHANNEL = process.env.UPDATER_CHANNEL || 'stable';
const CHECK_INTERVAL = 1000 * 60 * 5;

export function startUpdater() {
  let lastTag = null;
  setInterval(async () => {
    try {
      const res = await axios.get(`https://api.github.com/repos/${REPO}/releases`, {
        headers: TOKEN ? { Authorization: `token ${TOKEN}` } : {}
      });
      const releases = res.data.filter(r => r.tag_name.includes(CHANNEL));
      if (!releases.length) return;
      const latest = releases[0];
      if (latest.tag_name === lastTag) return;
      lastTag = latest.tag_name;
      const asset = latest.assets.find(a => a.name.endsWith('.zip'));
      if (!asset) return;
      const zipUrl = asset.browser_download_url;
      const zipRes = await axios.get(zipUrl, { responseType: 'arraybuffer', headers: TOKEN ? { Authorization: `token ${TOKEN}` } : {} });
      fs.writeFileSync('/tmp/update.zip', zipRes.data);
      // Optional: verify checksum/signature here
      exec('unzip -o /tmp/update.zip -d /opt/companion_new && mv /opt/companion_new /opt/companion && pm2 restart companion', (err, stdout) => {
        if (err) console.error('Update failed', err);
        else console.log('Updated to', latest.tag_name);
      });
    } catch (e) {
      console.error('Updater error', e.message);
    }
  }, CHECK_INTERVAL);
}
