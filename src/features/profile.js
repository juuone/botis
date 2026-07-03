/**
 * Ambil info profil WhatsApp seseorang sebisa mungkin lewat Baileys.
 * Nomor tidak ditampilkan (banyak akun sekarang pakai @lid / ID privasi sehingga
 * angkanya bukan nomor asli dan cuma bikin bingung), diganti info yang lebih berguna:
 * total warn orang itu di grup ini.
 */
async function getUserProfile(sock, jid, fallbackName) {
  let bio = null;
  try {
    const status = await sock.fetchStatus(jid);
    bio = status?.status || null;
  } catch (err) {
    bio = null;
  }

  let pictureUrl = null;
  try {
    pictureUrl = await sock.profilePictureUrl(jid, 'image');
  } catch (err) {
    pictureUrl = null;
  }

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
