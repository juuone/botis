/**
 * Ambil info profil WhatsApp seseorang sebisa mungkin lewat Baileys.
 * Nomor tidak ditampilkan (banyak akun sekarang pakai @lid / ID privasi sehingga
 * angkanya bukan nomor asli dan cuma bikin bingung), diganti info yang lebih berguna:
 * total warn orang itu di grup ini.
 */
async function getUserProfile(sock, jid, fallbackName) {
  // Dijalankan BARENGAN (bukan satu-satu) — ini yang bikin .user kerasa lemot
  // sebelumnya, karena tiap request ke server WhatsApp itu ada jeda jaringan sendiri.
  const [statusResult, pictureResult] = await Promise.allSettled([
    sock.fetchStatus(jid),
    sock.profilePictureUrl(jid, 'image'),
  ]);

  const bio = statusResult.status === 'fulfilled' ? statusResult.value?.status || null : null;
  const pictureUrl = pictureResult.status === 'fulfilled' ? pictureResult.value : null;

  return {
    jid,
    name: fallbackName || null,
    bio,
    pictureUrl,
  };
}

function buildProfileCaption(profile, warnInfo) {
  const lines = [
    '👤 *PROFIL WHATSAPP*',
    '',
    `🏷️ Nama: ${profile.name || '_tidak diketahui_'}`,
    `📝 Bio: ${profile.bio || '_tidak ada / privat_'}`,
  ];

  if (warnInfo?.inGroup) {
    lines.push(`⚠️ Total warn di grup ini: *${warnInfo.count}*`);
  } else {
    lines.push('⚠️ Total warn: _(hanya berlaku di dalam grup)_');
  }

  return lines.join('\n');
}

export { getUserProfile, buildProfileCaption };
