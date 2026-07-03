import config from '../config.js';

function parseCommand(text) {
  if (!text || !text.startsWith(config.prefix)) return null;
  const body = text.slice(config.prefix.length).trim();
  if (!body) return null;
  const [command, ...args] = body.split(/\s+/);
  return { command: command.toLowerCase(), args, rest: body.slice(command.length).trim() };
}

/** Ambil JID target dari mention atau dari pesan yang di-reply (quoted) */
function getTargetJid(msg) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  if (ctx?.mentionedJid?.length) return ctx.mentionedJid[0];
  if (ctx?.participant) return ctx.participant;
  return null;
}

function getAllMentioned(msg) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  return ctx?.mentionedJid || [];
}

export { parseCommand, getTargetJid, getAllMentioned };
