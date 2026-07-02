function pingResponse(startMs) {
  const latency = Date.now() - startMs;
  return `🏓 Pong! ${latency}ms`;
}

function randomNumber(min = 1, max = 100) {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

module.exports = { pingResponse, randomNumber };
