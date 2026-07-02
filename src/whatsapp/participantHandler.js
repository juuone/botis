const { getSettings } = require('../store/groupSettings');

/**
 * Deteksi bahasa dari kode negara nomor yang join/keluar.
 * +62 (Indonesia) -> id, selain itu atau tidak diketahui (mis. JID berbentuk @lid
 * karena privasi WhatsApp) -> default ke en (English).
 */
function detectLang(jid) {
  if (!jid || jid.endsWith('@lid')) return 'en';
  const number = jid.split('@')[0];
  return number.startsWith('62') ? 'id' : 'en';
}

function renderTemplate(template, userJid, groupName) {
  const userTag = `@${userJid.split('@')[0]}`;
  return template.replace(/@user/gi, userTag).replace(/@group/gi, groupName || 'this group');
}

async function onParticipantsUpdate(sock, update) {
  const { id: groupId, participants, action } = update;
  const settings = await getSettings(groupId);

  let groupName = '';
  try {
    const metadata = await sock.groupMetadata(groupId);
    groupName = metadata.subject;
  } catch (err) {
    // ignore
  }

  if (action === 'add' && settings.welcome.enabled) {
    for (const userJid of participants) {
      const lang = detectLang(userJid);
      const template = lang === 'id' ? settings.welcome.textId : settings.welcome.textEn;
      const text = renderTemplate(template, userJid, groupName);
      await sock.sendMessage(groupId, { text, mentions: [userJid] });
    }
  }

  if (action === 'remove' && settings.leaveMessage?.enabled) {
    for (const userJid of participants) {
      const lang = detectLang(userJid);
      const template = lang === 'id' ? settings.leaveMessage.textId : settings.leaveMessage.textEn;
      const text = renderTemplate(template, userJid, groupName);
      await sock.sendMessage(groupId, { text, mentions: [userJid] });
    }
  }
}

module.exports = { onParticipantsUpdate, detectLang };
