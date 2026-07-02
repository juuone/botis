const config = require('../config');
const { parseCommand } = require('../commands/parser');
const { isOwner, isGroupAdmin, normalizeJid } = require('../commands/permissions');
const { commands } = require('../commands/handler');
const { checkMessage, VIOLATION_LABELS } = require('../features/moderationEngine');
const { handleDm, handleOwnerDmExtra } = require('../dm/dmHandler');

// Command yang boleh dipakai owner lewat DM (tidak butuh konteks grup tertentu)
const DM_ALLOWED_COMMANDS = [
  'menu', 'ping', 'random', 'mcpatch', 'shaders', 'user', 'profil',
  'mcset', 'setowner', 'delowner', 'listowners',
];

function extractText(msg) {
  const m = msg.message;

  // respons dari tombol interaktif (quick_reply / list "Pilih Aksi") -> id yang kita
  // set sengaja berisi command teks aslinya, jadi tetap bisa diproses parser biasa
  const nativeFlow = m.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
  if (nativeFlow) {
    try {
      const parsed = JSON.parse(nativeFlow);
      if (parsed.id) return parsed.id;
    } catch (err) {
      // abaikan, lanjut ke fallback di bawah
    }
  }

  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.buttonsResponseMessage?.selectedDisplayText ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    m.templateButtonReplyMessage?.selectedId ||
    m.templateButtonReplyMessage?.selectedDisplayText ||
    ''
  );
}

async function onMessage(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  const isGroup = remoteJid.endsWith('@g.us');
  const ownJid = normalizeJid(sock.user?.id);

  // "Message Yourself": owner chat ke nomor bot sendiri lewat linked device. Ini satu-satunya
  // kasus di mana pesan fromMe:true tetap perlu diproses (supaya owner bisa kontrol bot).
  const isSelfChat = !isGroup && normalizeJid(remoteJid) === ownJid;
  if (msg.key.fromMe && !isSelfChat) return;

  const senderJid = normalizeJid(isGroup ? msg.key.participant : remoteJid);
  const text = extractText(msg);
  const startMs = Date.now();

  // ===== CHAT PRIBADI =====
  if (!isGroup) {
    const owner = await isOwner(sock, senderJid);

    // Member biasa (bukan owner) -> hanya dapat balasan link grup / pricelist otomatis
    if (!owner) {
      await handleDm(sock, msg, remoteJid, text);
      return;
    }

    const parsed = parseCommand(text);
    if (!parsed) {
      // sengaja TIDAK dibalas kalau bukan command, supaya self-chat ("Message Yourself")
      // tidak jadi loop tak berujung membalas pesannya sendiri.
      return;
    }

    const handledExtra = await handleOwnerDmExtra(sock, msg, remoteJid, parsed, owner);
    if (handledExtra) return;

    const cmd = commands[parsed.command];
    if (!cmd) return;

    if (!DM_ALLOWED_COMMANDS.includes(parsed.command)) {
      await sock.sendMessage(remoteJid, {
        text: '📍 Command moderasi/pengaturan grup harus dijalankan langsung di dalam grup terkait ya.',
      });
      return;
    }

    try {
      await cmd.handler({
        sock,
        msg,
        groupId: remoteJid,
        sender: senderJid,
        args: parsed.args,
        rest: parsed.rest,
        isAdmin: true,
        isOwner: owner,
        startMs,
      });
    } catch (err) {
      console.error(`[DM Command:${parsed.command}]`, err);
      await sock.sendMessage(remoteJid, { text: '❌ Terjadi kesalahan saat menjalankan command ini.' });
    }
    return;
  }

  // ===== GRUP =====
  if (!text) return;

  const owner = await isOwner(sock, senderJid);
  const admin = owner || (await isGroupAdmin(sock, remoteJid, senderJid));

  // 1) Jalankan pengecekan moderasi otomatis dulu (admin/owner otomatis bypass di dalam checkMessage)
  const result = await checkMessage(sock, msg, remoteJid, senderJid, text);
  if (result.violated) {
    if (!result.kicking) {
      const label = VIOLATION_LABELS[result.type] || result.type;
      const warnText = [
        `⚠️ *PELANGGARAN TERDETEKSI*`,
        '',
        `👤 @${senderJid.split('@')[0]}`,
        `📌 ${label}`,
        `📊 Warn: *${result.count}/${result.limit}*`,
      ].join('\n');
      await sock.sendMessage(remoteJid, { text: warnText, mentions: [senderJid] });
    }
    return;
  }

  // 2) Parse & jalankan command
  const parsed = parseCommand(text);
  if (!parsed) return;

  const cmd = commands[parsed.command];
  if (!cmd) return;

  if (cmd.ownerOnly && !owner) {
    await sock.sendMessage(remoteJid, { text: '🚫 Command ini khusus owner bot.' });
    return;
  }

  if (cmd.adminOnly && !admin) {
    await sock.sendMessage(remoteJid, { text: '🚫 Command ini khusus admin grup.' });
    return;
  }

  try {
    await cmd.handler({
      sock,
      msg,
      groupId: remoteJid,
      sender: senderJid,
      args: parsed.args,
      rest: parsed.rest,
      isAdmin: admin,
      isOwner: owner,
      startMs,
    });
  } catch (err) {
    console.error(`[Command:${parsed.command}]`, err);
    await sock.sendMessage(remoteJid, { text: '❌ Terjadi kesalahan saat menjalankan command ini.' });
  }
}

module.exports = { onMessage };
