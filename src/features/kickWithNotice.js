const config = require('../config');

/**
 * Tandai (tag) user dulu, kirim alasan, tunggu beberapa detik, baru benar-benar
 * dikeluarkan dari grup. Dipakai untuk kick manual maupun auto-kick dari sistem warn.
 */
async function kickWithNotice(sock, groupId, userJid, reason) {
  const tag = `@${userJid.split('@')[0]}`;
  const delay = config.kickDelaySeconds;

  const noticeText = [
    '🚨 *PEMBERITAHUAN KICK*',
    '',
    `👤 Member: ${tag}`,
    `📌 Alasan: _${reason}_`,
    `⏳ Akan dikeluarkan dalam ${delay} detik...`,
  ].join('\n');

  await sock.sendMessage(groupId, { text: noticeText, mentions: [userJid] });

  setTimeout(async () => {
    try {
      await sock.groupParticipantsUpdate(groupId, [userJid], 'remove');
      await sock.sendMessage(groupId, {
        text: `👢 ${tag} telah *dikeluarkan* dari grup.\n📌 Alasan: _${reason}_`,
        mentions: [userJid],
      });
    } catch (err) {
      await sock.sendMessage(groupId, {
        text: `⚠️ Gagal mengeluarkan ${tag}. Pastikan bot masih menjadi *admin grup*.`,
        mentions: [userJid],
      });
    }
  }, delay * 1000);
}

module.exports = { kickWithNotice };
