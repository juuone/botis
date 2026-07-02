const config = require('../config');
const { parseCommand } = require('../commands/parser');
const { listGroupIds } = require('../store/groupSettings');

function buildGroupLinkMessage() {
  return [
    '👋 *Halo!*',
    '',
    'Bot ini hanya aktif di dalam grup. Silakan join grup kami dulu ya:',
    '',
    `🔗 ${config.groupInviteLink}`,
  ].join('\n');
}

function buildPricelistMessage() {
  return [
    '💰 *PRICELIST LAYANAN*',
    '',
    `▸ ${config.priceText}`,
    '',
    'Untuk berlangganan / info lebih lanjut, hubungi:',
    `📧 ${config.priceContact}`,
  ].join('\n');
}

function buildDefaultDmMessage() {
  return `${buildGroupLinkMessage()}\n\n${buildPricelistMessage()}\n\n_Ketik *.group* untuk link grup atau *.price* untuk pricelist._`;
}

/**
 * Menangani pesan chat pribadi dari MEMBER BIASA (bukan admin/owner).
 * Admin/owner ditangani terpisah di messageHandler dan bisa pakai command penuh.
 */
async function handleDm(sock, msg, senderJid, text) {
  const parsed = parseCommand(text);

  if (parsed?.command === 'group') {
    await sock.sendMessage(senderJid, { text: buildGroupLinkMessage(), footer: config.footerText });
    return;
  }
  if (parsed?.command === 'price' || parsed?.command === 'pricelist') {
    await sock.sendMessage(senderJid, { text: buildPricelistMessage(), footer: config.footerText });
    return;
  }

  await sock.sendMessage(senderJid, { text: buildDefaultDmMessage(), footer: config.footerText });
}

/** Command tambahan khusus owner via DM (di luar command grup biasa) */
async function handleOwnerDmExtra(sock, msg, senderJid, parsed, isOwnerUser) {
  if (parsed.command === 'listgroups' || parsed.command === 'broadcast') {
    if (!isOwnerUser) {
      await sock.sendMessage(senderJid, { text: '🚫 Command ini khusus owner bot.' });
      return true;
    }
  }

  if (parsed.command === 'listgroups') {
    const ids = await listGroupIds();
    await sock.sendMessage(senderJid, {
      text: ids.length ? `📋 Bot aktif di ${ids.length} grup:\n${ids.join('\n')}` : 'Bot belum tergabung di grup manapun.',
    });
    return true;
  }
  if (parsed.command === 'broadcast') {
    const text = parsed.rest;
    if (!text) {
      await sock.sendMessage(senderJid, { text: `Format: ${config.prefix}broadcast <pesan>` });
      return true;
    }
    const ids = await listGroupIds();
    for (const groupId of ids) {
      try {
        await sock.sendMessage(groupId, { text: `📢 *Pengumuman*\n\n${text}` });
      } catch (err) {
        // skip grup yang gagal
      }
    }
    await sock.sendMessage(senderJid, { text: `✅ Broadcast terkirim ke ${ids.length} grup.` });
    return true;
  }
  return false;
}

module.exports = { handleDm, handleOwnerDmExtra, buildGroupLinkMessage, buildPricelistMessage };
