const URL_REGEX = /((https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[^\s]*)?)|(chat\.whatsapp\.com\/[A-Za-z0-9]+)/gi;

function extractLinks(text = '') {
  const matches = text.match(URL_REGEX);
  return matches ? matches.map((m) => m.toLowerCase()) : [];
}

function isWhitelisted(link, whitelist = []) {
  const normalizedLink = link.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
  return whitelist.some((entry) => {
    const normalizedEntry = entry.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
    return normalizedLink.includes(normalizedEntry);
  });
}

/** Return true jika pesan mengandung link yang TIDAK ada di whitelist */
function containsBlockedLink(text, whitelist = []) {
  const links = extractLinks(text);
  if (!links.length) return false;
  return links.some((link) => !isWhitelisted(link, whitelist));
}

export { extractLinks, isWhitelisted, containsBlockedLink };
