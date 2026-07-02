const config = require('../config');
const { quickButton, urlButton, listButton, buildInteractiveMessage } = require('./buttons');

/**
 * .mcpatch — kartu info Minecraft: versi terbaru saat ini + link mcpatch.me.
 * Versi & link disimpan di database (bot_meta), diatur lewat `.mcpatch set version|link`.
 */
function buildMcpatchInfo(version, link) {
  const text = [
    config.mcpatch.title,
    '',
    config.mcpatch.description,
    '',
    `📦 Versi terbaru saat ini: *${version}*`,
  ].join('\n');

  return buildInteractiveMessage(text, [
    urlButton('🔗 Buka mcpatch.me', link),
    quickButton('🧩 Cari Shaders', `${config.prefix}shaders`),
  ]);
}

/** .shaders (tanpa argumen) — pilih varian dulu: Vibrant Visuals atau Non-Vibrant */
function buildShadersIntro() {
  const text = '🧩 *SHADERS MINECRAFT*\n\nPilih varian shaders yang kamu mau:';

  return buildInteractiveMessage(text, [
    quickButton(config.mcpatch.variants.vibrant, `${config.prefix}shaders vibrant`),
    quickButton(config.mcpatch.variants.nonvibrant, `${config.prefix}shaders nonvibrant`),
  ]);
}

/** Setelah varian dipilih tapi versi belum, tampilkan daftar versi yang tersedia */
function buildVersionPrompt(variant, versions) {
  const variantLabel = config.mcpatch.variants[variant] || variant;

  if (!versions.length) {
    return {
      text: `😔 Belum ada link shaders untuk varian *${variantLabel}*.\nHubungi admin bot untuk menambahkan datanya lewat \`${config.prefix}mcset add\`.`,
      footer: config.footerText,
    };
  }

  const header = `🧩 *${variantLabel}* — pilih versi Minecraft:`;

  // pakai tombol quick-reply kalau cuma sedikit, list "Pilih Versi" kalau banyak
  if (versions.length <= 3) {
    return buildInteractiveMessage(
      header,
      versions.map((v) => quickButton(`🎮 ${v}`, `${config.prefix}shaders ${variant} ${v}`))
    );
  }

  const sections = [
    {
      title: variantLabel,
      rows: versions.map((v) => ({
        title: `🎮 ${v}`,
        description: 'Tap untuk lihat link download',
        id: `${config.prefix}shaders ${variant} ${v}`,
      })),
    },
  ];

  return buildInteractiveMessage(header, [listButton('☰ Pilih Versi', sections)]);
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
  return { text, footer: config.footerText };
}

function buildShaderNotFound(variant, version) {
  const variantLabel = config.mcpatch.variants[variant] || variant;
  return {
    text: `❌ Link shaders untuk *${variantLabel}* versi *${version}* belum tersedia.\nCoba varian/versi lain lewat ${config.prefix}shaders`,
    footer: config.footerText,
  };
}

module.exports = {
  buildMcpatchInfo,
  buildShadersIntro,
  buildVersionPrompt,
  buildShaderResult,
  buildShaderNotFound,
};
