require('dotenv').config();

function parseOwners(str) {
  if (!str) return [];
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((num) => (num.includes('@') ? num : `${num}@s.whatsapp.net`));
}

module.exports = {
  prefix: process.env.PREFIX || '.',
  // OWNER_NUMBERS di .env sekarang cuma jadi "seed" opsional (best-effort, bisa gagal
  // kalau WhatsApp mengirim JID dalam format @lid). Cara paling ANDAL jadi owner:
  // 1) nomor yang dipakai bot sendiri OTOMATIS jadi owner (chat "Message Yourself"
  //    ke nomor bot lewat linked device / WhatsApp Web)
  // 2) owner yang sudah aktif bisa tambah owner lain lewat .setowner @user (tersimpan di DB)
  owners: parseOwners(process.env.OWNER_NUMBERS),
  groupInviteLink: process.env.GROUP_INVITE_LINK || 'https://chat.whatsapp.com/xxxxxxxxxxxxxxxxxxxx',
  priceText: process.env.PRICE_TEXT || 'Rp. 10.000/bulan',
  priceContact: process.env.PRICE_CONTACT || 'contact@juuone.me',
  port: process.env.PORT || 3000,
  selfUrl: process.env.SELF_URL || '',

  // Teks kecil (footer) yang tampil di bawah pesan bertombol
  footerText: process.env.FOOTER_TEXT || '© WA Mod Bot 2026',

  // Turso (libSQL) - database persisten, tidak hilang saat Render redeploy
  turso: {
    url: process.env.TURSO_DATABASE_URL || '',
    authToken: process.env.TURSO_AUTH_TOKEN || '',
  },

  // Delay (detik) sebelum member benar-benar dikeluarkan setelah pesan
  // peringatan/tag dikirim (kick manual maupun auto-kick dari sistem warn)
  kickDelaySeconds: parseInt(process.env.KICK_DELAY_SECONDS || '5', 10),

  mcpatch: {
    title: '🧱 Minecraft Patch Update Terbaru',
    description:
      'Info update/patch terbaru untuk Minecraft PE/Bedrock. Klik tombol di bawah untuk buka halaman resminya.',
    // Nilai default sebelum owner mengatur lewat .mcpatch set version / .mcpatch set link
    defaultVersion: '1.21.90',
    defaultLink: 'https://mcpatch.me/mcpe',
    variants: {
      vibrant: '✨ Vibrant Visuals',
      nonvibrant: '🎮 Non-Vibrant (Normal)',
    },
  },

  // Default settings tiap grup baru
  defaultGroupSettings: {
    antilink: { enabled: true, whitelist: [] },
    antitagadmin: { enabled: true },
    antitagall: { enabled: true, threshold: 5 }, // dianggap "tag semua" kalau mention >= threshold orang
    antitagstatus: { enabled: true },
    antiflood: { enabled: false, maxMessages: 6, windowSeconds: 8 },
    antibadword: { enabled: false, words: [] },
    warnLimits: {
      antilink: 3,
      antitagadmin: 3,
      antitagall: 3,
      antitagstatus: 3,
      antiflood: 3,
      antibadword: 3,
      default: 3,
    },
    autoKickAt: 3,
    // Bilingual: default EN. Kalau nomor yang join berawalan 62 (Indonesia) -> pakai versi ID,
    // selain itu (atau tidak bisa dideteksi, misal JID berupa @lid) -> pakai versi EN.
    welcome: {
      enabled: true,
      textEn: 'Welcome @user to @group! 🎉\nPlease read the group rules first 🙏',
      textId: 'Selamat datang @user di @group! 🎉\nBaca dulu rules grup ya 🙏',
    },
    leaveMessage: {
      enabled: false,
      textEn: '👋 @user has left the group.',
      textId: '👋 @user telah keluar dari grup.',
    },
  },
};
