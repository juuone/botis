import { normalizeJid } from '../commands/permissions.js';

/** Tag admin: user biasa nge-mention salah satu admin grup */
function isTagAdminViolation(mentionedJids, adminJids, senderIsAdmin) {
  if (senderIsAdmin) return false;
  if (!mentionedJids.length) return false;
  const admins = adminJids.map(normalizeJid);
  return mentionedJids.some((jid) => admins.includes(normalizeJid(jid)));
}

/** Tag semua: jumlah mention di satu pesan >= threshold (dianggap "tag all") */
function isTagAllViolation(mentionedJids, threshold, senderIsAdmin) {
  if (senderIsAdmin) return false;
  return mentionedJids.length >= threshold;
}

/**
 * Tag status: pesan yang berasal dari "mention via status" (fitur WA membalas/mention
 * seseorang lewat status mereka lalu masuk ke chat/grup), atau forward status ke grup
 * dengan mention. Dideteksi lewat contextInfo yang mengarah ke status@broadcast.
 */
function isTagStatusViolation(msg, senderIsAdmin) {
  if (senderIsAdmin) return false;
  const ctx = msg.message?.extendedTextMessage?.contextInfo || msg.message?.imageMessage?.contextInfo;
  if (!ctx) return false;
  const fromStatus =
    ctx.remoteJid === 'status@broadcast' ||
    ctx.participant === 'status@broadcast' ||
    (ctx.isForwarded && ctx.forwardedNewsletterMessageInfo === undefined && ctx.remoteJid === 'status@broadcast');
  return !!fromStatus;
}

export { isTagAdminViolation, isTagAllViolation, isTagStatusViolation };
