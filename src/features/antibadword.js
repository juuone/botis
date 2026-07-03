function containsBadWord(text = '', words = []) {
  if (!words.length) return false;
  const lower = text.toLowerCase();
  return words.some((w) => lower.includes(w.toLowerCase()));
}

export { containsBadWord };
