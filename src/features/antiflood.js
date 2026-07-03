// State di memory (tidak perlu persist, reset tiap restart tidak masalah)
const history = new Map(); // key: `${groupId}:${userJid}` -> array of timestamps(ms)

function isFlooding(groupId, userJid, maxMessages, windowSeconds) {
  const key = `${groupId}:${userJid}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const arr = (history.get(key) || []).filter((t) => now - t <= windowMs);
  arr.push(now);
  history.set(key, arr);
  return arr.length > maxMessages;
}

export { isFlooding };
