import config from '../config.js';
import { menuLine, menuSection, quickButton, listButton } from './buttons.js';

/**
 * Menu utama. Isi `buttons` dipakai kalau native flow berhasil render (list
 * "Pilih Aksi" berisi command per kategori). Isi `text` selalu dikirim sebagai
 * body/fallback, jadi tetap kebaca & bisa di-tap-hold-copy walau tombolnya
 * tidak muncul di device tertentu.
 */
function buildMenuMessage() {
  const p = config.prefix;

  const umum = menuSection('✨ UMUM', [
    menuLine('🏓', 'Cek respon bot', `${p}ping`),
    menuLine('🎲', 'Angka acak', `${p}random 1 100`),
    menuLine('🧱', 'Versi Minecraft terbaru + link', `${p}mcpatch`),
    menuLine('🎨', 'Cari link shaders', `${p}shaders`),
    menuLine('👤', 'Profil WhatsApp saya', `${p}user`),
  ]);

  const moderasi = menuSection('🛡️ MODERASI (admin)', [
    menuLine('👢', 'Kick member', `${p}kick @user alasan`),
    menuLine('⚠️', 'Warn manual', `${p}warn @user alasan`),
    menuLine('♻️', 'Reset warn', `${p}resetwarn @user`),
    menuLine('📋', 'Daftar warn grup ini', `${p}warnlist`),
    menuLine('⬆️', 'Jadikan admin', `${p}promote @user`),
    menuLine('⬇️', 'Turunkan admin', `${p}demote @user`),
    menuLine('🔒', 'Tutup grup (khusus admin chat)', `${p}close`),
    menuLine('🔓', 'Buka grup (semua bisa chat)', `${p}open`),
    menuLine('📊', 'Bikin polling', `${p}poll Pertanyaan|Opsi1|Opsi2`),
  ]);

  const pengaturan = menuSection('⚙️ PENGATURAN (admin)', [
    menuLine('🔗', 'Antilink on/off', `${p}antilink on`),
    menuLine('📝', 'Kelola whitelist link', `${p}whitelist list`),
    menuLine('🚫', 'Antitag admin', `${p}antitagadmin on`),
    menuLine('🚫', 'Antitag semua', `${p}antitagall on`),
    menuLine('🚫', 'Antitag status', `${p}antitagstatus on`),
    menuLine('🌊', 'Antiflood', `${p}antiflood on`),
    menuLine('🤬', 'Antibadword', `${p}antibadword on`),
    menuLine('👋', 'Welcome message', `${p}welcome on`),
    menuLine('🚪', 'Leave message', `${p}leavemsg on`),
    menuLine('📄', 'Lihat semua pengaturan', `${p}settings`),
  ]);

  const text = [
    '🤖 *WA MODERATOR BOT*',
    '_Bot khusus moderasi grup — bukan bot game_',
    '',
    'Tap tombol "☰ Pilih Menu" di bawah, atau tap-hold command buat copy manual.',
    '',
    umum,
    '',
    moderasi,
    '',
    pengaturan,
  ].join('\n');

  const buttons = [
    listButton('☰ Pilih Menu', [
      {
        title: 'Umum',
        rows: [
          { id: `${p}ping`, title: '🏓 Ping', description: 'Cek respon bot' },
          { id: `${p}mcpatch`, title: '🧱 MCPatch', description: 'Versi Minecraft terbaru' },
          { id: `${p}shaders`, title: '🎨 Shaders', description: 'Cari link shaders' },
          { id: `${p}user`, title: '👤 Profil Saya', description: 'Lihat profil WhatsApp' },
        ],
      },
      {
        title: 'Moderasi (admin)',
        rows: [
          { id: `${p}warnlist`, title: '📋 Daftar Warn', description: 'Lihat warn grup ini' },
          { id: `${p}settings`, title: '⚙️ Pengaturan', description: 'Lihat semua setting grup' },
        ],
      },
    ]),
  ];

  return { text, buttons };
}

export { buildMenuMessage };
