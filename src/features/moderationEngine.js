const { getSettings } = require('../store/groupSettings');
const warns = require('../store/warns');
const { getAdminJids, isGroupAdmin, isOwner } = require('../commands/permissions');
const { containsBlockedLink } = require('./antilink');
const { isTagAdminViolation, isTagAllViolation, isTagStatusViolation } = require('./antitag');
const { isFlooding } = require('./antiflood');
const { containsBadWord } = require('./antibadword');
const { getAllMentioned } = require('../commands/parser');
const { kickWithNotice } = require('./kickWithNotice');

const VIOLATION_LABELS = {
  antilink: 'Mengirim link terlarang',
  antitagadmin: 'Nge-tag admin',
  antitagall: 'Nge-tag terlalu banyak orang (tag semua)',
  antitagstatus: 'Nge-tag lewat status',
  antiflood: 'Flooding / spam chat',
  antibadword: 'Menggunakan kata terlarang',
};

/**
 * Cek pesan grup terhadap semua rule aktif. Kalau melanggar: hapus pesan (kalau bisa),
 * tambah warn ke user (per JID, bukan per nama), lalu kalau sudah mencapai limit —
 * tag & beri tahu alasan dulu, baru dikick otomatis setelah jeda beberapa detik.
 * Return: { violated: boolean, type, count, limit, kicking }
 */
async function checkMessage(sock, msg, groupId, senderJid, text) {
  const settings = await getSettings(groupId);
  const senderIsAdmin = await isGroupAdmin(sock, groupId, senderJid);
  const senderIsOwner = await isOwner(sock, senderJid);

  if (senderIsAdmin || senderIsOwner) return { violated: false };

  const mentioned = getAllMentioned(msg);
  const adminJids = await getAdminJids(sock, groupId);

  let violationType = null;

  if (settings.antilink.enabled && containsBlockedLink(text, settings.antilink.whitelist)) {
    violationType = 'antilink';
  } else if (settings.antitagadmin.enabled && isTagAdminViolation(mentioned, adminJids, senderIsAdmin)) {
    violationType = 'antitagadmin';
  } else if (
    settings.antitagall.enabled &&
    isTagAllViolation(mentioned, settings.antitagall.threshold, senderIsAdmin)
  ) {
    violationType = 'antitagall';
  } else if (settings.antitagstatus.enabled && isTagStatusViolation(msg, senderIsAdmin)) {
    violationType = 'antitagstatus';
  } else if (
    settings.antiflood.enabled &&
    isFlooding(groupId, senderJid, settings.antiflood.maxMessages, settings.antiflood.windowSeconds)
  ) {
    violationType = 'antiflood';
  } else if (settings.antibadword.enabled && containsBadWord(text, settings.antibadword.words)) {
    violationType = 'antibadword';
  }

  if (!violationType) return { violated: false };

  // Coba hapus pesan pelanggar (butuh bot jadi admin grup)
  try {
    await sock.sendMessage(groupId, { delete: msg.key });
  } catch (err) {
    // bot mungkin bukan admin, abaikan saja
  }

  const label = VIOLATION_LABELS[violationType];
  const record = await warns.addWarn(groupId, senderJid, violationType, label);
  const limit = settings.warnLimits[violationType] ?? settings.warnLimits.default;
  const autoKickAt = settings.autoKickAt;

  const shouldKick = record.count >= limit && record.count >= autoKickAt;

  if (shouldKick) {
    await warns.resetWarn(groupId, senderJid);
    // tag dulu + kasih alasan, baru dikick otomatis setelah delay (di dalam kickWithNotice)
    await kickWithNotice(sock, groupId, senderJid, `${label} (mencapai ${record.count}x warn)`);
    return { violated: true, type: violationType, count: record.count, limit, kicking: true };
  }

  return { violated: true, type: violationType, count: record.count, limit, kicking: false };
}

module.exports = { checkMessage, VIOLATION_LABELS };
