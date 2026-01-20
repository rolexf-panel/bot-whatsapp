import express from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initSessionManager } from './bot/sessionManager.js';
import { startUpdater } from './updater/updater.js';
dotenv.config();

const app = express();
app.use(helmet());
app.use(express.json());

const limiter = rateLimit({ windowMs: 15*60*1000, max: 200 });
app.use('/api/', limiter);

// Basic auth for pairing UI
app.use('/pair', (req, res, next) => {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;
  const auth = req.headers.authorization || '';
  const [scheme, encoded] = auth.split(' ');
  if (scheme === 'Basic' && Buffer.from(encoded || '', 'base64').toString() === `${user}:${pass}`) return next();
  res.setHeader('WWW-Authenticate', 'Basic realm="Pairing"');
  return res.status(401).send('Unauthorized');
});

app.use(express.static('public'));

const server = http.createServer(app);
const io = new IOServer(server, { cors: { origin: '*' } });

io.on('connection', socket => {
  console.log('UI connected', socket.id);
});

initSessionManager(io);

if (process.env.UPDATER_ENABLED === 'true') startUpdater();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
