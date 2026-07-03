import config from '../config.js';
import { urlButton, quickButton, listButton } from './buttons.js';

/**
 * .mcpatch — kartu info Minecraft: versi terbaru saat ini + link mcpatch.me.
 * Versi & link disimpan di database (bot_meta), diatur lewat `.mcpatch set version|link`.
 * Tombol "Buka mcpatch.me" pakai cta_url (native flow); teksnya tetap sertakan
 * link mentah juga sebagai fallback kalau tombolnya tidak render.
 */
function buildMcpatchInfo(version, link) {
  const p = config.prefix;
  const text = [
    config.mcpatch.title,
    '',
    config.mcpatch.description,
    '',
    `📦 Versi terbaru saat ini: *${version}*`,
    `🔗 ${link}`,
    '',
    `Ketik \`${p}shaders\` buat cari link shaders.`,
  ].join('\n');

  const buttons = [
    urlButton('🔗 Buka mcpatch.me', link),
    quickButton('🎨 Cari Shaders', `${p}shaders`),
  ];

  return { text, buttons };
}

/** .shaders (tanpa argumen) — pilih varian dulu: Vibrant Visuals atau Non-Vibrant */
function buildShadersIntro() {
  const p = config.prefix;
  const text = [
    '🧩 *SHADERS MINECRAFT*',
    '',
    'Pilih varian shaders yang kamu mau, ketik salah satu:',
    '',
    `✨ ${config.mcpatch.variants.vibrant} — \`${p}shaders vibrant\``,
    `🎮 ${config.mcpatch.variants.nonvibrant} — \`${p}shaders nonvibrant\``,
  ].join('\n');

  const buttons = [
    quickButton(config.mcpatch.variants.vibrant, `${p}shaders vibrant`),
    quickButton(config.mcpatch.variants.nonvibrant, `${p}shaders nonvibrant`),
  ];

  return { text, buttons };
}

/** Setelah varian dipilih tapi versi belum, tampilkan daftar versi yang tersedia */
function buildVersionPrompt(variant, versions) {
  const p = config.prefix;
  const variantLabel = config.mcpatch.variants[variant] || variant;

  if (!versions.length) {
    return {
      text: `😔 Belum ada link shaders untuk varian *${variantLabel}*.\nHubungi admin bot untuk menambahkan datanya lewat \`${p}mcset add\`.`,
    };
  }

  const list = versions.map((v) => `🎮 ${v} — \`${p}shaders ${variant} ${v}\``).join('\n');
  const text = [
    `🧩 *${variantLabel}* — pilih versi Minecraft:`,
    '',
    list,
  ].join('\n');

  // list "Pilih Versi" kalau native flow render, maksimal muat banyak baris tanpa masalah
  const buttons = [
    listButton(
      '🎮 Pilih Versi',
      [
        {
          title: variantLabel,
          rows: versions.map((v) => ({
            id: `${p}shaders ${variant} ${v}`,
            title: v,
            description: 'Tap untuk dapat link download',
          })),
        },
      ]
    ),
  ];

  return { text, buttons };
}

/** Hasil akhir: link download shaders */
function buildShaderResult(variant, version, link) {
  const variantLabel = config.mcpatch.variants[variant] || variant;
  const text = [
    '✅ *Shaders ditemukan!*',
    '',
    `🧩 Varian: ${variantLabel}`,
    `🎮 Versi: *${version}*`,
    '',
    `🔗 ${link}`,
  ].join('\n');
  const buttons = [urlButton('🔗 Download Shaders', link)];
  return { text, buttons };
}

function buildShaderNotFound(variant, version) {
  const variantLabel = config.mcpatch.variants[variant] || variant;
  return {
    text: `❌ Link shaders untuk *${variantLabel}* versi *${version}* belum tersedia.\nCoba varian/versi lain lewat ${config.prefix}shaders`,
  };
}

export {
  buildMcpatchInfo,
  buildShadersIntro,
  buildVersionPrompt,
  buildShaderResult,
  buildShaderNotFound,
};
