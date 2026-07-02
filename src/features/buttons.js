const config = require('../config');

/**
 * Helper untuk pesan interaktif WhatsApp (native flow message) — tombol quick-reply,
 * tombol buka link, dan tombol list ("Pilih Aksi" seperti di bot-bot lain).
 *
 * Format ini (interactiveButtons) berbeda dari templateButtons versi lama yang sudah
 * jarang muncul di app WhatsApp terbaru. Kalau di device tertentu tombolnya tetap tidak
 * muncul, isi `id` pada tiap tombol kita samakan dengan command teks aslinya (mis. ".menu")
 * supaya tetap gampang diketik manual sebagai fallback.
 */

/** Tombol quick-reply: tap -> otomatis "mengirim" command dengan id ini */
function quickButton(displayText, id) {
  return { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: displayText, id: id || displayText }) };
}

/** Tombol yang langsung buka link */
function urlButton(displayText, url) {
  return {
    name: 'cta_url',
    buttonParamsJson: JSON.stringify({ display_text: displayText, url, merchant_url: url }),
  };
}

/**
 * Tombol list ("Pilih Aksi") — tap tombol lalu muncul daftar pilihan.
 * sections: [{ title: 'Judul Section', rows: [{ title, description, id }] }]
 */
function listButton(buttonText, sections) {
  return {
    name: 'single_select',
    buttonParamsJson: JSON.stringify({ title: buttonText, sections }),
  };
}

/**
 * Bangun payload pesan interaktif siap kirim lewat sock.sendMessage().
 * @param {string} text isi pesan utama
 * @param {Array} buttons array hasil quickButton()/urlButton()/listButton()
 * @param {string} footer teks kecil di bawah (default: branding dari config)
 */
function buildInteractiveMessage(text, buttons, footer) {
  return {
    text,
    footer: footer || config.footerText,
    interactiveButtons: buttons,
  };
}

module.exports = { quickButton, urlButton, listButton, buildInteractiveMessage };
