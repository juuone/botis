const config = require('../config');
const { quickButton, listButton, buildInteractiveMessage } = require('./buttons');
const { header, section, command } = require('./ui');

function buildMenuText() {
  return [
    header('WA MODERATOR CLI', 'moderation • utilities • minecraft'),
    '',
    section('quick start', [
      `tap *Pilih Aksi* untuk membuka command palette`,
      `atau ketik manual dengan prefix *${config.prefix}*`,
      `owner bisa kontrol dari DM / Message Yourself`,
    ]),
    '',
    section('highlight', [
      command('settings', 'lihat konfigurasi grup'),
      command('warnlist', 'cek daftar warn'),
      command('mcpatch', 'info Minecraft patch terbaru'),
    ]),
  ].join('\n');
}

/** Menu utama dengan command palette: quick actions + list pilihan per kategori. */
function buildMenuMessage() {
  const p = config.prefix;
  const sections = [
    {
      title: 'CORE / UMUM',
      rows: [
        { title: 'Ping', description: 'Cek latency bot', id: `${p}ping` },
        { title: 'Random Number', description: 'Generate angka 1-100', id: `${p}random 1 100` },
        { title: 'Profil Saya', description: 'Lihat profil WhatsApp + warn', id: `${p}user` },
        { title: 'Buat Polling', description: 'Template command polling', id: `${p}poll Pertanyaan | Opsi A | Opsi B` },
      ],
    },
    {
      title: 'MINECRAFT',
      rows: [
        { title: 'Minecraft Patch', description: 'Versi terbaru + direct link', id: `${p}mcpatch` },
        { title: 'Shaders', description: 'Pilih varian dan versi shaders', id: `${p}shaders` },
      ],
    },
    {
      title: 'MODERATION / ADMIN',
      rows: [
        { title: 'Settings', description: 'Lihat status fitur grup', id: `${p}settings` },
        { title: 'Warn List', description: 'Daftar user yang kena warn', id: `${p}warnlist` },
        { title: 'Close Group', description: 'Hanya admin yang bisa chat', id: `${p}close` },
        { title: 'Open Group', description: 'Semua member bisa chat', id: `${p}open` },
      ],
    },
    {
      title: 'SECURITY TOGGLE / ADMIN',
      rows: [
        { title: 'Antilink ON', description: 'Aktifkan filter link', id: `${p}antilink on` },
        { title: 'Antilink OFF', description: 'Matikan filter link', id: `${p}antilink off` },
        { title: 'Antiflood ON', description: 'Aktifkan filter spam pesan', id: `${p}antiflood on` },
        { title: 'Badword ON', description: 'Aktifkan filter kata terlarang', id: `${p}antibadword on` },
      ],
    },
  ];

  return buildInteractiveMessage(buildMenuText(), [
    quickButton('Ping', `${p}ping`),
    quickButton('Settings', `${p}settings`),
    listButton('Pilih Aksi', sections),
  ], 'tap button untuk auto-kirim command • fallback: ketik manual');
}

module.exports = { buildMenuText, buildMenuMessage };
