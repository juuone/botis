import path from 'path';
import { fileURLToPath } from 'url';
import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import logger from '../logger.js';
import { onMessage } from './messageHandler.js';
import { onParticipantsUpdate } from './participantHandler.js';
import * as qrState from './qrState.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_DIR = path.join(__dirname, '..', '..', 'data', 'auth');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: ['WA-Mod-Bot', 'Chrome', '1.0.0'],
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      logger.info('QR code baru diterima. Buka /qr di browser untuk scan (log ASCII sering pecah di web log viewer).');
      // fallback: tetap coba print di terminal (berguna kalau run lokal)
      qrcodeTerminal.generate(qr, { small: true });
      try {
        const dataUrl = await QRCode.toDataURL(qr, { width: 320, margin: 1 });
        qrState.setQr(qr, dataUrl);
      } catch (err) {
        logger.error(err, 'Gagal generate QR image');
      }
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      logger.warn(`Koneksi terputus. Reconnect: ${shouldReconnect}`);
      qrState.setStatus('reconnecting');
      if (shouldReconnect) {
        startBot();
      } else {
        logger.error('Logged out dari WhatsApp. Hapus folder data/auth lalu scan ulang QR.');
        qrState.setStatus('logged_out');
      }
    } else if (connection === 'open') {
      logger.info('✅ Bot WhatsApp berhasil connect!');
      qrState.setStatus('connected');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m) => {
    try {
      const msg = m.messages?.[0];
      if (!msg || !msg.message) return;
      await onMessage(sock, msg);
    } catch (err) {
      logger.error(err, 'Error di messages.upsert');
    }
  });

  sock.ev.on('group-participants.update', async (update) => {
    try {
      await onParticipantsUpdate(sock, update);
    } catch (err) {
      logger.error(err, 'Error di group-participants.update');
    }
  });

  return sock;
}

export { startBot };
