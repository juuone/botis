// State sederhana untuk share QR code terbaru antara koneksi WA dan web server.
let latestQr = null; // raw string dari baileys
let latestQrDataUrl = null; // data:image/png;base64,... untuk ditampilkan di browser
let connectionStatus = 'starting'; // starting | qr_pending | connected | error

function setQr(qr, dataUrl) {
  latestQr = qr;
  latestQrDataUrl = dataUrl;
  connectionStatus = 'qr_pending';
}

function clearQr() {
  latestQr = null;
  latestQrDataUrl = null;
}

function setStatus(status) {
  connectionStatus = status;
  if (status === 'connected') clearQr();
}

function getState() {
  return { latestQr, latestQrDataUrl, connectionStatus };
}

module.exports = { setQr, clearQr, setStatus, getState };
