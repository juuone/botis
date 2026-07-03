import config from '../config.js';

/**
 * ====================================================================
 * CATATAN PENTING — BACA SEBELUM UBAH FILE INI
 * ====================================================================
 * WhiskeySockets/Baileys resmi SENGAJA tidak menyertakan 3 "binary node"
 * pembungkus (biz, interactive/native_flow, bot) yang dibutuhkan WhatsApp
 * supaya pesan interaktif (quick_reply, single_select "Pilih Aksi", cta_url)
 * benar-benar dirender di layar penerima. Tanpa node ini, WhatsApp cuma
 * mengabaikan bagian tombolnya dan menampilkan body teks polos saja.
 *
 * Modul ini menambahkan kembali node yang hilang itu secara MANDIRI (bukan
 * pakai paket npm pihak ketiga yang kecil/tidak teraudit), dengan cara
 * memanggil sock.relayMessage() langsung + additionalNodes, alih-alih lewat
 * sock.sendMessage() biasa.
 *
 * STATUS: EKSPERIMENTAL. Struktur node ini disusun dari pola yang
 * didokumentasikan komunitas (bukan dari source resmi WhatsApp), jadi:
 *   - Bisa saja tidak 100% render di semua versi app WhatsApp
 *   - Bisa berhenti berfungsi kapan saja kalau WhatsApp mengubah validasi
 *   - SELALU ada fallback ke teks biasa kalau pengiriman native gagal,
 *     supaya bot tidak pernah macet/pesan tidak terkirim
 *
 * Bisa dimatikan sepenuhnya (balik ke mode teks yang sudah pasti stabil)
 * lewat ENABLE_NATIVE_BUTTONS=false di .env.
 * ====================================================================
 */

const NATIVE_ENABLED = process.env.ENABLE_NATIVE_BUTTONS !== 'false';

function quickButton(displayText, id) {
  return { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: displayText, id: id || displayText }) };
}

function urlButton(displayText, url) {
  return { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: displayText, url, merchant_url: url }) };
}

/** sections: [{ title, rows: [{ id, title, description? }] }] */
function listButton(title, sections) {
  return { name: 'single_select', buttonParamsJson: JSON.stringify({ title, sections }) };
}

/** Bangun binary node tambahan yang dibutuhkan WhatsApp untuk merender interactive message */
function buildInteractiveNodes(isGroup) {
  const nodes = [
    {
      tag: 'biz',
      attrs: {},
      content: [
        {
          tag: 'interactive',
          attrs: { type: 'native_flow', v: '1' },
          content: [{ tag: 'native_flow', attrs: { name: 'mixed', v: '1' } }],
        },
      ],
    },
  ];
  // Chat pribadi butuh node "bot" tambahan supaya WhatsApp tahu ini pesan dari business/bot flow
  if (!isGroup) {
    nodes.push({ tag: 'bot', attrs: { biz_bot: '1' } });
  }
  return nodes;
}

/**
 * Kirim pesan interaktif native (quick reply / list / url button).
 * Otomatis fallback ke teks biasa kalau native gagal terkirim.
 * @param {object} sock - socket Baileys aktif
 * @param {string} jid - tujuan (grup atau pribadi)
 * @param {{text: string, footer?: string, buttons: object[]}} content
 */
async function sendInteractive(sock, jid, content) {
  const footer = content.footer || config.footerText;

  if (!NATIVE_ENABLED) {
    return sock.sendMessage(jid, { text: content.text, footer });
  }

  try {
    const baileys = await import('@whiskeysockets/baileys');
    const generateWAMessageFromContent = baileys.generateWAMessageFromContent || baileys.default?.generateWAMessageFromContent;

    if (typeof generateWAMessageFromContent !== 'function') {
      throw new Error('generateWAMessageFromContent tidak tersedia di versi Baileys ini');
    }

    const isGroup = jid.endsWith('@g.us');

    const messageContent = {
      interactiveMessage: {
        body: { text: content.text },
        footer: { text: footer },
        nativeFlowMessage: { buttons: content.buttons },
      },
    };

    const fullMsg = generateWAMessageFromContent(jid, messageContent, {
      userJid: sock.user.id,
    });

    await sock.relayMessage(jid, fullMsg.message, {
      messageId: fullMsg.key.id,
      additionalNodes: buildInteractiveNodes(isGroup),
    });

    return fullMsg;
  } catch (err) {
    // Native flow gagal (versi Baileys berubah, WhatsApp menolak, dll) -> fallback aman ke teks biasa
    return sock.sendMessage(jid, { text: content.text, footer });
  }
}

/** Bangun 1 baris menu: emoji + judul + command siap-copy (fallback teks) */
function menuLine(emoji, label, command) {
  return `${emoji} ${label} — \`${command}\``;
}

/** Bangun section menu (judul + daftar baris) */
function menuSection(title, lines) {
  return `*${title}*\n${lines.join('\n')}`;
}

/** Payload teks biasa (dipakai kalau memang tidak butuh tombol sama sekali) */
function textMessage(text, footer) {
  return { text, footer: footer || config.footerText };
}

export { quickButton, urlButton, listButton, sendInteractive, textMessage, menuLine, menuSection, NATIVE_ENABLED };
