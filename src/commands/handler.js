import config from '../config.js';
import { getSettings, updateSettings } from '../store/groupSettings.js';
import * as warns from '../store/warns.js';
import * as shadersStore from '../store/shaders.js';
import * as metaStore from '../store/meta.js';
import * as ownersStore from '../store/owners.js';
import { getTargetJid } from './parser.js';
import { sendInteractive } from '../features/buttons.js';
import { pingResponse, randomNumber } from '../features/games.js';
import { buildMenuMessage } from '../features/menu.js';
import {
  buildMcpatchInfo,
  buildShadersIntro,
  buildVersionPrompt,
  buildShaderResult,
  buildShaderNotFound,
} from '../features/mcpatch.js';
import { kickWithNotice } from '../features/kickWithNotice.js';
import { getUserProfile, buildProfileCaption } from '../features/profile.js';

const VALID_VARIANTS = ['vibrant', 'nonvibrant'];
const VALID_LANGS = ['en', 'id'];

/**
 * Semua command grup. context = {
 *   sock, msg, groupId, sender, args, rest, isAdmin, isOwner, startMs
 * }
 */
const commands = {
  // ===== UMUM =====
  menu: {
    adminOnly: false,
    handler: async ({ sock, groupId }) => {
      await sendInteractive(sock, groupId, buildMenuMessage());
    },
  },
  ping: {
    adminOnly: false,
    handler: async ({ sock, groupId, startMs }) => {
      await sock.sendMessage(groupId, { text: pingResponse(startMs), footer: config.footerText });
    },
  },
  random: {
    adminOnly: false,
    handler: async ({ sock, groupId, args }) => {
      const min = parseInt(args[0], 10);
      const max = parseInt(args[1], 10);
      const num = Number.isFinite(min) && Number.isFinite(max) ? randomNumber(min, max) : randomNumber(1, 100);
      await sock.sendMessage(groupId, { text: `🎲 Angka acak: *${num}*`, footer: config.footerText });
    },
  },
  mcpatch: {
    adminOnly: false,
    handler: async ({ sock, groupId, args, isOwner: owner }) => {
      const sub = (args[0] || '').toLowerCase();

      if (sub === 'set') {
        if (!owner) {
          await sock.sendMessage(groupId, { text: '🚫 Command ini khusus owner bot.' });
          return;
        }
        const field = (args[1] || '').toLowerCase();
        const value = args.slice(2).join(' ');

        if (field === 'version' && value) {
          await metaStore.setMeta('mcpatch_version', value);
          await sock.sendMessage(groupId, { text: `✅ Versi Minecraft terbaru diset ke *${value}*.` });
          return;
        }
        if (field === 'link' && value) {
          await metaStore.setMeta('mcpatch_link', value);
          await sock.sendMessage(groupId, { text: `✅ Link mcpatch.me diset ke:\n${value}` });
          return;
        }
        await sock.sendMessage(groupId, {
          text: `Format:\n${config.prefix}mcpatch set version <versi>\n${config.prefix}mcpatch set link <url>`,
        });
        return;
      }

      const version = (await metaStore.getMeta('mcpatch_version')) || config.mcpatch.defaultVersion;
      const link = (await metaStore.getMeta('mcpatch_link')) || config.mcpatch.defaultLink;
      await sendInteractive(sock, groupId, buildMcpatchInfo(version, link));
    },
  },
  shaders: {
    adminOnly: false,
    handler: async ({ sock, groupId, args }) => {
      const variant = (args[0] || '').toLowerCase();
      const version = args[1];

      if (!variant) {
        await sendInteractive(sock, groupId, buildShadersIntro());
        return;
      }

      if (!VALID_VARIANTS.includes(variant)) {
        await sock.sendMessage(groupId, { text: `Format: ${config.prefix}shaders <vibrant|nonvibrant> [versi]` });
        return;
      }

      if (!version) {
        const versions = await shadersStore.listShaderVersions();
        const filtered = [];
        for (const v of versions) {
          const link = await shadersStore.getShaderLink(v, variant);
          if (link) filtered.push(v);
        }
        await sendInteractive(sock, groupId, buildVersionPrompt(variant, filtered));
        return;
      }

      const link = await shadersStore.getShaderLink(version, variant);
      if (!link) {
        await sock.sendMessage(groupId, buildShaderNotFound(variant, version));
        return;
      }
      await sendInteractive(sock, groupId, buildShaderResult(variant, version, link));
    },
  },
  user: {
    adminOnly: false,
    handler: async ({ sock, msg, groupId, sender }) => {
      const target = getTargetJid(msg) || sender;
      const fallbackName = target === sender ? msg.pushName : null;
      const profile = await getUserProfile(sock, target, fallbackName);

      const isGroupChat = groupId.endsWith('@g.us');
      let warnInfo = { inGroup: false, count: 0 };
      if (isGroupChat) {
        const record = await warns.getUserWarn(groupId, target);
        warnInfo = { inGroup: true, count: record.count };
      }

      const caption = buildProfileCaption(profile, warnInfo);

      if (profile.pictureUrl) {
        await sock.sendMessage(groupId, { image: { url: profile.pictureUrl }, caption, mentions: [target] });
      } else {
        await sock.sendMessage(groupId, { text: caption, mentions: [target] });
      }
    },
  },
  profil: { adminOnly: false, handler: null }, // alias, di-set di bawah

  // ===== MODERASI (admin only, tag dulu baru kick beneran) =====
  kick: {
    adminOnly: true,
    handler: async ({ sock, msg, groupId, args }) => {
      const target = getTargetJid(msg);
      if (!target) return sock.sendMessage(groupId, { text: '❗ Tag atau reply pesan orang yang mau dikick.' });
      const reason = args.slice(1).join(' ') || 'Dikeluarkan oleh admin';
      await kickWithNotice(sock, groupId, target, reason);
    },
  },
  warn: {
    adminOnly: true,
    handler: async ({ sock, msg, groupId, args }) => {
      const target = getTargetJid(msg);
      if (!target) return sock.sendMessage(groupId, { text: '❗ Tag atau reply pesan orang yang mau di-warn.' });
      const reason = args.slice(1).join(' ') || 'Peringatan manual dari admin';
      const record = await warns.addWarn(groupId, target, 'manual', reason);
      const settings = await getSettings(groupId);
      const limit = settings.warnLimits.default;
      const tag = `@${target.split('@')[0]}`;

      if (record.count >= limit && record.count >= settings.autoKickAt) {
        await warns.resetWarn(groupId, target);
        await sock.sendMessage(groupId, {
          text: `⚠️ ${tag} mencapai batas warn (${record.count}/${limit}).`,
          mentions: [target],
        });
        await kickWithNotice(sock, groupId, target, `${reason} (mencapai ${record.count}x warn)`);
        return;
      }

      await sock.sendMessage(groupId, {
        text: [
          `⚠️ *WARN DITAMBAHKAN*`,
          '',
          `👤 ${tag}`,
          `📌 Alasan: _${reason}_`,
          `📊 Total warn: *${record.count}/${limit}*`,
        ].join('\n'),
        mentions: [target],
      });
    },
  },
  resetwarn: {
    adminOnly: true,
    handler: async ({ sock, msg, groupId }) => {
      const target = getTargetJid(msg);
      if (!target) return sock.sendMessage(groupId, { text: '❗ Tag atau reply orang yang mau direset warn-nya.' });
      await warns.resetWarn(groupId, target);
      await sock.sendMessage(groupId, { text: `✅ Warn @${target.split('@')[0]} sudah direset.`, mentions: [target] });
    },
  },
  warnlist: {
    adminOnly: true,
    handler: async ({ sock, groupId }) => {
      const all = await warns.listWarns(groupId);
      const entries = Object.entries(all).filter(([, v]) => v.count > 0);
      if (!entries.length) return sock.sendMessage(groupId, { text: '✅ Belum ada warn di grup ini.' });
      const lines = entries.map(([jid, v]) => `▸ @${jid.split('@')[0]} — *${v.count}x* warn`);
      await sock.sendMessage(groupId, {
        text: `📋 *DAFTAR WARN GRUP INI*\n\n${lines.join('\n')}`,
        mentions: entries.map(([jid]) => jid),
      });
    },
  },
  promote: {
    adminOnly: true,
    handler: async ({ sock, msg, groupId }) => {
      const target = getTargetJid(msg);
      if (!target) return sock.sendMessage(groupId, { text: '❗ Tag atau reply orang yang mau dijadikan admin.' });
      await sock.groupParticipantsUpdate(groupId, [target], 'promote');
      await sock.sendMessage(groupId, { text: `⬆️ @${target.split('@')[0]} sekarang jadi admin.`, mentions: [target] });
    },
  },
  demote: {
    adminOnly: true,
    handler: async ({ sock, msg, groupId }) => {
      const target = getTargetJid(msg);
      if (!target) return sock.sendMessage(groupId, { text: '❗ Tag atau reply orang yang mau diturunkan.' });
      await sock.groupParticipantsUpdate(groupId, [target], 'demote');
      await sock.sendMessage(groupId, { text: `⬇️ @${target.split('@')[0]} sudah bukan admin.`, mentions: [target] });
    },
  },
  // .close / .open = kunci-buka grup (alias: mute/unmute)
  close: {
    adminOnly: true,
    handler: async ({ sock, groupId }) => {
      await sock.groupSettingUpdate(groupId, 'announcement');
      await sock.sendMessage(groupId, { text: '🔒 Grup ditutup, hanya admin yang bisa chat.' });
    },
  },
  open: {
    adminOnly: true,
    handler: async ({ sock, groupId }) => {
      await sock.groupSettingUpdate(groupId, 'not_announcement');
      await sock.sendMessage(groupId, { text: '🔓 Grup dibuka, semua member bisa chat lagi.' });
    },
  },
  mute: { adminOnly: true, handler: null }, // alias .close
  unmute: { adminOnly: true, handler: null }, // alias .open

  // ===== POLLING =====
  poll: {
    adminOnly: true,
    handler: async ({ sock, groupId, rest }) => {
      const parts = rest.split('|').map((s) => s.trim()).filter(Boolean);
      if (parts.length < 3) {
        return sock.sendMessage(groupId, {
          text: `Format: ${config.prefix}poll <pertanyaan> | <opsi1> | <opsi2> | ...\nMinimal 2 opsi.`,
        });
      }
      const [question, ...optionsRaw] = parts;
      const options = optionsRaw.slice(0, 12);
      await sock.sendMessage(groupId, { poll: { name: question, values: options, selectableCount: 1 } });
    },
  },

  // ===== PENGATURAN (admin only) =====
  antilink: {
    adminOnly: true,
    handler: async ({ sock, groupId, args }) => toggleSetting(sock, groupId, args, 'antilink'),
  },
  whitelist: {
    adminOnly: true,
    handler: async ({ sock, groupId, args }) => {
      const [action, ...rest] = args;
      const settings = await getSettings(groupId);
      const link = rest.join(' ');
      if (action === 'add' && link) {
        settings.antilink.whitelist.push(link);
        await updateSettings(groupId, { antilink: { whitelist: settings.antilink.whitelist } });
        return sock.sendMessage(groupId, { text: `✅ "${link}" ditambahkan ke whitelist antilink.` });
      }
      if (action === 'del' && link) {
        const filtered = settings.antilink.whitelist.filter((w) => w !== link);
        await updateSettings(groupId, { antilink: { whitelist: filtered } });
        return sock.sendMessage(groupId, { text: `🗑️ "${link}" dihapus dari whitelist.` });
      }
      if (action === 'list') {
        const list = settings.antilink.whitelist;
        return sock.sendMessage(groupId, {
          text: list.length ? `📋 *Whitelist:*\n${list.map((l) => `▸ ${l}`).join('\n')}` : 'Whitelist masih kosong.',
        });
      }
      await sock.sendMessage(groupId, { text: `Format: ${config.prefix}whitelist add|del|list <link/domain>` });
    },
  },
  antitagadmin: {
    adminOnly: true,
    handler: async ({ sock, groupId, args }) => toggleSetting(sock, groupId, args, 'antitagadmin'),
  },
  antitagall: {
    adminOnly: true,
    handler: async ({ sock, groupId, args }) => {
      if (args[0] === 'threshold' && args[1]) {
        const n = parseInt(args[1], 10);
        if (!Number.isFinite(n) || n < 1) return sock.sendMessage(groupId, { text: 'Angka threshold tidak valid.' });
        await updateSettings(groupId, { antitagall: { threshold: n } });
        return sock.sendMessage(groupId, { text: `✅ Threshold antitagall diset ke ${n} mention.` });
      }
      return toggleSetting(sock, groupId, args, 'antitagall');
    },
  },
  antitagstatus: {
    adminOnly: true,
    handler: async ({ sock, groupId, args }) => toggleSetting(sock, groupId, args, 'antitagstatus'),
  },
  antiflood: {
    adminOnly: true,
    handler: async ({ sock, groupId, args }) => toggleSetting(sock, groupId, args, 'antiflood'),
  },
  antibadword: {
    adminOnly: true,
    handler: async ({ sock, groupId, args }) => toggleSetting(sock, groupId, args, 'antibadword'),
  },
  badword: {
    adminOnly: true,
    handler: async ({ sock, groupId, args }) => {
      const [action, ...rest] = args;
      const settings = await getSettings(groupId);
      const word = rest.join(' ');
      if (action === 'add' && word) {
        settings.antibadword.words.push(word);
        await updateSettings(groupId, { antibadword: { words: settings.antibadword.words } });
        return sock.sendMessage(groupId, { text: `✅ Kata "${word}" ditambahkan ke filter.` });
      }
      if (action === 'del' && word) {
        const filtered = settings.antibadword.words.filter((w) => w !== word);
        await updateSettings(groupId, { antibadword: { words: filtered } });
        return sock.sendMessage(groupId, { text: `🗑️ Kata "${word}" dihapus dari filter.` });
      }
      if (action === 'list') {
        const list = settings.antibadword.words;
        return sock.sendMessage(groupId, {
          text: list.length ? `📋 *Kata terlarang:*\n${list.map((w) => `▸ ${w}`).join('\n')}` : 'Belum ada kata terlarang.',
        });
      }
      await sock.sendMessage(groupId, { text: `Format: ${config.prefix}badword add|del|list <kata>` });
    },
  },
  setwarnlimit: {
    adminOnly: true,
    handler: async ({ sock, groupId, args }) => {
      const [type, valueStr] = args;
      const value = parseInt(valueStr, 10);
      const validTypes = ['antilink', 'antitagadmin', 'antitagall', 'antitagstatus', 'antiflood', 'antibadword', 'default'];
      if (!validTypes.includes(type) || !Number.isFinite(value) || value < 1) {
        return sock.sendMessage(groupId, {
          text: `Format: ${config.prefix}setwarnlimit <tipe> <angka>\nTipe: ${validTypes.join(', ')}`,
        });
      }
      await updateSettings(groupId, { warnLimits: { [type]: value } });
      await sock.sendMessage(groupId, { text: `✅ Limit warn "${type}" diset ke ${value}.` });
    },
  },
  setautokick: {
    adminOnly: true,
    handler: async ({ sock, groupId, args }) => {
      const value = parseInt(args[0], 10);
      if (!Number.isFinite(value) || value < 1) {
        return sock.sendMessage(groupId, { text: `Format: ${config.prefix}setautokick <angka>` });
      }
      await updateSettings(groupId, { autoKickAt: value });
      await sock.sendMessage(groupId, { text: `✅ Auto-kick akan aktif setelah ${value}x warn.` });
    },
  },
  welcome: {
    adminOnly: true,
    handler: async ({ sock, groupId, args }) => toggleSetting(sock, groupId, args, 'welcome'),
  },
  setwelcome: {
    adminOnly: true,
    handler: async ({ sock, groupId, args, rest }) => {
      const lang = (args[0] || '').toLowerCase();
      const text = rest.slice(lang.length).trim();
      if (!VALID_LANGS.includes(lang) || !text) {
        return sock.sendMessage(groupId, {
          text: `Format: ${config.prefix}setwelcome <en|id> <teks> (boleh pakai @user @group)\nContoh: ${config.prefix}setwelcome id Halo @user, selamat datang di @group!`,
        });
      }
      const field = lang === 'id' ? 'textId' : 'textEn';
      await updateSettings(groupId, { welcome: { [field]: text } });
      await sock.sendMessage(groupId, { text: `✅ Pesan welcome (${lang.toUpperCase()}) berhasil diubah.` });
    },
  },
  leavemsg: {
    adminOnly: true,
    handler: async ({ sock, groupId, args }) => toggleSetting(sock, groupId, args, 'leaveMessage'),
  },
  setleavemsg: {
    adminOnly: true,
    handler: async ({ sock, groupId, args, rest }) => {
      const lang = (args[0] || '').toLowerCase();
      const text = rest.slice(lang.length).trim();
      if (!VALID_LANGS.includes(lang) || !text) {
        return sock.sendMessage(groupId, {
          text: `Format: ${config.prefix}setleavemsg <en|id> <teks> (boleh pakai @user @group)`,
        });
      }
      const field = lang === 'id' ? 'textId' : 'textEn';
      await updateSettings(groupId, { leaveMessage: { [field]: text } });
      await sock.sendMessage(groupId, { text: `✅ Pesan leave (${lang.toUpperCase()}) berhasil diubah.` });
    },
  },
  settings: {
    adminOnly: true,
    handler: async ({ sock, groupId }) => {
      const s = await getSettings(groupId);
      const text = `
⚙️ *PENGATURAN GRUP INI*

🔗 Antilink: ${flag(s.antilink.enabled)} _(whitelist: ${s.antilink.whitelist.length})_
🚫 Antitag Admin: ${flag(s.antitagadmin.enabled)}
🚫 Antitag Semua: ${flag(s.antitagall.enabled)} _(threshold: ${s.antitagall.threshold})_
🚫 Antitag Status: ${flag(s.antitagstatus.enabled)}
🌊 Antiflood: ${flag(s.antiflood.enabled)} _(${s.antiflood.maxMessages} pesan / ${s.antiflood.windowSeconds}s)_
🤬 Antibadword: ${flag(s.antibadword.enabled)} _(${s.antibadword.words.length} kata)_
👋 Welcome: ${flag(s.welcome.enabled)} _(dwibahasa EN/ID otomatis)_
🚪 Leave message: ${flag(s.leaveMessage?.enabled)} _(dwibahasa EN/ID otomatis)_
👢 Auto-kick di: *${s.autoKickAt}x* warn

*Limit warn per tipe:*
${Object.entries(s.warnLimits).map(([k, v]) => `▸ ${k}: ${v}`).join('\n')}
`.trim();
      await sock.sendMessage(groupId, { text, footer: config.footerText });
    },
  },

  // ===== OWNER BOT =====
  setowner: {
    adminOnly: true,
    ownerOnly: true,
    handler: async ({ sock, msg, groupId, sender }) => {
      const target = getTargetJid(msg);
      if (!target) return sock.sendMessage(groupId, { text: '❗ Tag atau reply orang yang mau dijadikan owner.' });
      await ownersStore.addOwner(target, sender);
      await sock.sendMessage(groupId, { text: `✅ @${target.split('@')[0]} sekarang jadi owner bot.`, mentions: [target] });
    },
  },
  delowner: {
    adminOnly: true,
    ownerOnly: true,
    handler: async ({ sock, msg, groupId }) => {
      const target = getTargetJid(msg);
      if (!target) return sock.sendMessage(groupId, { text: '❗ Tag atau reply orang yang mau dicabut owner-nya.' });
      await ownersStore.removeOwner(target);
      await sock.sendMessage(groupId, { text: `✅ @${target.split('@')[0]} sudah bukan owner bot lagi.`, mentions: [target] });
    },
  },
  listowners: {
    adminOnly: true,
    ownerOnly: true,
    handler: async ({ sock, groupId }) => {
      const jids = await ownersStore.listOwnerJids();
      await sock.sendMessage(groupId, {
        text: jids.length
          ? `📋 *Owner tambahan* (di luar nomor login bot):\n${jids.map((j) => `▸ ${j}`).join('\n')}`
          : 'Belum ada owner tambahan. Nomor tempat bot login otomatis jadi owner.',
      });
    },
  },

  // ===== KELOLA DATA SHADERS (khusus owner, global — bukan per grup) =====
  mcset: {
    adminOnly: true,
    ownerOnly: true,
    handler: async ({ sock, groupId, args }) => {
      const [action, variant, version, ...linkParts] = args;
      const link = linkParts.join(' ');

      if (action === 'add') {
        if (!VALID_VARIANTS.includes(variant) || !version || !link) {
          return sock.sendMessage(groupId, {
            text: `Format: ${config.prefix}mcset add <vibrant|nonvibrant> <versi> <link>`,
          });
        }
        await shadersStore.setShaderLink(version, variant, link);
        return sock.sendMessage(groupId, { text: `✅ Link shaders *${variant}* versi *${version}* disimpan.` });
      }

      if (action === 'del') {
        if (!VALID_VARIANTS.includes(variant) || !version) {
          return sock.sendMessage(groupId, { text: `Format: ${config.prefix}mcset del <vibrant|nonvibrant> <versi>` });
        }
        await shadersStore.deleteShaderLink(version, variant);
        return sock.sendMessage(groupId, { text: `🗑️ Link shaders *${variant}* versi *${version}* dihapus.` });
      }

      if (action === 'list') {
        const all = await shadersStore.listAllShaders();
        if (!all.length) return sock.sendMessage(groupId, { text: 'Belum ada data shaders tersimpan.' });
        const lines = all.map((r) => `▸ ${r.variant} — ${r.version}: ${r.link}`);
        return sock.sendMessage(groupId, { text: `📋 *Data Shaders:*\n\n${lines.join('\n')}` });
      }

      await sock.sendMessage(groupId, {
        text: `Format:\n${config.prefix}mcset add <vibrant|nonvibrant> <versi> <link>\n${config.prefix}mcset del <vibrant|nonvibrant> <versi>\n${config.prefix}mcset list`,
      });
    },
  },
};

// alias
commands.profil.handler = commands.user.handler;
commands.mute.handler = commands.close.handler;
commands.unmute.handler = commands.open.handler;

function flag(v) {
  return v ? '✅ ON' : '❌ OFF';
}

async function toggleSetting(sock, groupId, args, key) {
  const val = (args[0] || '').toLowerCase();
  if (val !== 'on' && val !== 'off') {
    return sock.sendMessage(groupId, { text: `Format: ${config.prefix}${key} on/off` });
  }
  await updateSettings(groupId, { [key]: { enabled: val === 'on' } });
  await sock.sendMessage(groupId, { text: `✅ ${key} sekarang: ${val === 'on' ? 'ON' : 'OFF'}` });
}

export { commands };
