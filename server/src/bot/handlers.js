export async function handleMessage(client, msg, io) {
  const from = msg.from;
  const body = msg.body || '';
  // simple command parsing
  if (body.startsWith('!ping')) {
    await client.sendMessage(from, 'Pong ✅');
    return;
  }
  if (body.startsWith('!welcome')) {
    await client.sendMessage(from, 'Halo! Saya pendamping grup Anda. Ketik !help untuk daftar perintah.');
    return;
  }
  // emit to dashboard
  io.emit('message', { from, body, id: msg.id });
}
