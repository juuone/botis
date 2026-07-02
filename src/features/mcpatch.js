const config = require('../config');
const { quickButton, urlButton, listButton, buildInteractiveMessage } = require('./buttons');
const { header, section, row, success, error } = require('./ui');

/**
 * .mcpatch — kartu info Minecraft: versi terbaru saat ini + link mcpatch.me.
 * Versi & link disimpan di database (bot_meta), diatur lewat `.mcpatch set version|link`.
 */
function buildMcpatchInfo(version, link) {
  const text = [
    header('MCPATCH CENTER', 'Minecraft PE / Bedrock update tracker'),
    '',
    section('release info', [
      row('latest version', `*${version}*`),
      row('source', 'mcpatch.me'),
    ]),
    '',
    config.mcpatch.description,
  ].join('\n');

  return buildInteractiveMessage(text, [
    urlButton('Open mcpatch.me', link),
    quickButton('Cari Shaders', `${config.prefix}shaders`),
  ]);
}

/** .shaders (tanpa argumen) — pilih varian dulu: Vibrant Visuals atau Non-Vibrant */
function buildShadersIntro() {
  const text = [
    header('SHADERS SELECT', 'pilih varian visual'),
    '',
    section('available actions', ['tap salah satu tombol di bawah', 'bot akan auto-kirim command sesuai pilihan']),
  ].join('\n');

  return buildInteractiveMessage(text, [
    quickButton('Vibrant Visuals', `${config.prefix}shaders vibrant`),
    quickButton('Non-Vibrant', `${config.prefix}shaders nonvibrant`),
  ]);
}

/** Setelah varian dipilih tapi versi belum, tampilkan daftar versi yang tersedia */
function buildVersionPrompt(variant, versions) {
  const variantLabel = config.mcpatch.variants[variant] || variant;

  if (!versions.length) {
    return {
      text: `${error(`Belum ada link shaders untuk varian *${variantLabel}*.`)}\n${row('admin action', `tambahkan lewat \`${config.prefix}mcset add\``)}`,
      footer: config.footerText,
    };
  }

  const header = section(`${variantLabel} / version picker`, ['pilih versi Minecraft yang tersedia']);

  // pakai tombol quick-reply kalau cuma sedikit, list "Pilih Versi" kalau banyak
  if (versions.length <= 3) {
    return buildInteractiveMessage(
      header,
      versions.map((v) => quickButton(v, `${config.prefix}shaders ${variant} ${v}`))
    );
  }

  const sections = [
    {
      title: variantLabel,
      rows: versions.map((v) => ({
        title: v,
        description: 'Tap untuk lihat link download',
        id: `${config.prefix}shaders ${variant} ${v}`,
      })),
    },
  ];

  return buildInteractiveMessage(header, [listButton('Pilih Versi', sections)]);
}

/** Hasil akhir: link download shaders */
function buildShaderResult(variant, version, link) {
  const variantLabel = config.mcpatch.variants[variant] || variant;
  const text = [
    success('Shaders ditemukan'),
    '',
    section('download detail', [
      row('variant', variantLabel),
      row('version', `*${version}*`),
      row('link', link),
    ]),
  ].join('\n');
  return { text, footer: config.footerText };
}

function buildShaderNotFound(variant, version) {
  const variantLabel = config.mcpatch.variants[variant] || variant;
  return {
    text: `${error(`Link shaders untuk *${variantLabel}* versi *${version}* belum tersedia.`)}\n${row('next', `coba varian/versi lain lewat ${config.prefix}shaders`)}`,
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
