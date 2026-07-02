const config = require('../config');
const ownersStore = require('../store/owners');

function normalizeJid(jid) {
  if (!jid) return jid;
  // buang suffix device (:xx) dan pastikan format standar
  return jid.split(':')[0].includes('@') ? jid.split(':')[0] : jid;
}

/**
 * Owner ditentukan dengan cara yang TIDAK bergantung ke format nomor (karena WhatsApp
 * sekarang sering pakai @lid / ID privasi yang bukan nomor asli, jadi cocok-cocokan
 * string nomor gampang gagal). Ada 2 sumber kebenaran:
 *   1) Nomor tempat bot ini login SELALU owner (deteksi via sock.user.id, cocok kalau
 *      owner chat bot lewat fitur "Message Yourself" di WhatsApp).
 *   2) JID yang sudah ditambahkan manual lewat .setowner (disimpan persis apa adanya
 *      di database, jadi tetap akurat walau berbentuk @lid).
 * OWNER_NUMBERS di .env cuma fallback tambahan opsional, tidak reliable sendirian.
 */
async function isOwner(sock, jid) {
  const norm = normalizeJid(jid);
  const ownJid = normalizeJid(sock?.user?.id);
  if (ownJid && norm === ownJid) return true;
  if (config.owners.includes(norm)) return true;
  return ownersStore.isOwnerJid(norm);
}

async function isGroupAdmin(sock, groupId, jid) {
  try {
    const metadata = await sock.groupMetadata(groupId);
    const norm = normalizeJid(jid);
    const participant = metadata.participants.find((p) => normalizeJid(p.id) === norm);
    return !!participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
  } catch (err) {
    return false;
  }
}

async function getAdminJids(sock, groupId) {
  try {
    const metadata = await sock.groupMetadata(groupId);
    return metadata.participants.filter((p) => p.admin).map((p) => normalizeJid(p.id));
  } catch (err) {
    return [];
  }
}

module.exports = { normalizeJid, isOwner, isGroupAdmin, getAdminJids };
