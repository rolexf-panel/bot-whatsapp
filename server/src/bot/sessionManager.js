import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import { handleMessage } from './handlers.js';

export function initSessionManager(io) {
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'companion' }),
    puppeteer: { headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] }
  });

  client.on('qr', async qr => {
    const dataUrl = await qrcode.toDataURL(qr);
    io.emit('qr', { dataUrl });
  });

  client.on('ready', () => {
    io.emit('ready', { ok: true });
    console.log('WhatsApp client ready');
  });

  client.on('message', msg => {
    try { handleMessage(client, msg, io); } catch (e) { console.error(e); }
  });

  client.on('auth_failure', (msg) => {
    console.error('Auth failure', msg);
    io.emit('auth_failure', { msg });
  });

  client.initialize();
}
