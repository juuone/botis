const config = require('../config');
const { listButton, buildInteractiveMessage } = require('./buttons');

function buildMenuText() {
  return `
🤖 *WA MODERATOR BOT*
_Bot khusus moderasi grup — bukan bot game_

Tap tombol *Pilih Aksi* di bawah untuk langsung jalankan command, atau ketik manual pakai prefix \`${config.prefix}\`.

💡 Owner bisa chat bot di mana saja (termasuk DM lewat "Message Yourself"). Admin grup pakai command langsung di dalam grup masing-masing. Member biasa hanya bisa berinteraksi di dalam grup.
`.trim();
}

/** Menu utama dengan tombol list "Pilih Aksi", dikelompokkan per kategori */
function buildMenuMessage() {
  const p = config.prefix;
  const sections = [
    {
      title: '✨ Umum',
      rows: [
        { title: '🏓 Ping', description: 'Cek respon bot', id: `${p}ping` },
        { title: '🎲 Angka Acak', description: `${p}random 1 100`, id: `${p}random 1 100` },
        { title: '🧱 MCPatch', description: 'Versi Minecraft terbaru + link', id: `${p}mcpatch` },
        { title: '🎨 Shaders', description: 'Cari link shaders', id: `${p}shaders` },
        { title: '👤 Profil Saya', description: 'Lihat profil WhatsApp', id: `${p}user` },
      ],
    },
    {
      title: '🛡️ Moderasi (admin)',
      rows: [
        { title: '📋 Daftar Warn', description: 'Lihat semua warn di grup ini', id: `${p}warnlist` },
        { title: '🔒 Tutup Grup', description: 'Hanya admin yang bisa chat', id: `${p}close` },
        { title: '🔓 Buka Grup', description: 'Semua member bisa chat', id: `${p}open` },
        { title: '⚙️ Pengaturan Grup', description: 'Lihat semua pengaturan', id: `${p}settings` },
      ],
    },
  ];

  return buildInteractiveMessage(buildMenuText(), [listButton('☰ Pilih Aksi', sections)]);
}

module.exports = { buildMenuText, buildMenuMessage };
