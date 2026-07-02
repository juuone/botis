const express = require('express');
const config = require('./src/config');
const logger = require('./src/logger');
const { startBot } = require('./src/whatsapp/connection');
const qrState = require('./src/whatsapp/qrState');
const { initDb } = require('./src/store/db');

const app = express();

app.get('/', (req, res) => {
  const { connectionStatus } = qrState.getState();
  res.json({ status: connectionStatus, service: 'wa-mod-bot', time: new Date().toISOString() });
});

// Buka /qr di browser (bukan di log Render) supaya QR tidak pecah/rusak
app.get('/qr', (req, res) => {
  const { latestQrDataUrl, connectionStatus } = qrState.getState();

  if (connectionStatus === 'connected') {
    res.send(`
      <html><body style="font-family:sans-serif;text-align:center;margin-top:80px">
        <h2>✅ Bot sudah terhubung ke WhatsApp</h2>
        <p>Tidak perlu scan QR lagi.</p>
      </body></html>
    `);
    return;
  }

  if (!latestQrDataUrl) {
    res.send(`
      <html><head><meta http-equiv="refresh" content="3"></head>
      <body style="font-family:sans-serif;text-align:center;margin-top:80px">
        <h2>⏳ Menunggu QR code...</h2>
        <p>Halaman ini akan auto-refresh tiap 3 detik.</p>
        <p>Status: ${connectionStatus}</p>
      </body></html>
    `);
    return;
  }

  res.send(`
    <html><head><meta http-equiv="refresh" content="20"></head>
    <body style="font-family:sans-serif;text-align:center;margin-top:40px">
      <h2>📱 Scan QR ini di WhatsApp</h2>
      <p>WhatsApp → Perangkat Tertaut → Tautkan Perangkat</p>
      <img src="${latestQrDataUrl}" alt="QR Code" style="width:320px;height:320px;border:8px solid #eee;border-radius:12px" />
      <p style="color:#888">Halaman auto-refresh tiap 20 detik (QR WhatsApp berganti berkala).</p>
    </body></html>
  `);
});

// Endpoint ini yang di-hit oleh cron-job.org supaya Render tidak sleep
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

app.listen(config.port, () => {
  logger.info(`🌐 Web server jalan di port ${config.port}`);
});

// Self-ping opsional sebagai backup dari cron-job.org (kalau SELF_URL diisi)
if (config.selfUrl) {
  setInterval(async () => {
    try {
      await fetch(`${config.selfUrl}/ping`);
    } catch (err) {
      // abaikan
    }
  }, 4 * 60 * 1000); // tiap 4 menit
}

initDb()
  .then(() => startBot())
  .catch((err) => {
    qrState.setStatus('error');
    logger.error(err, 'Gagal start bot (cek TURSO_DATABASE_URL & TURSO_AUTH_TOKEN di .env)');
  });
