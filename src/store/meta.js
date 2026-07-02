const { getClient } = require('./db');

async function getMeta(key, fallback = null) {
  const db = getClient();
  const res = await db.execute({ sql: 'SELECT value FROM bot_meta WHERE key = ?', args: [key] });
  return res.rows.length ? res.rows[0].value : fallback;
}

async function setMeta(key, value) {
  const db = getClient();
  await db.execute({
    sql: `
      INSERT INTO bot_meta (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
    args: [key, value],
  });
}

module.exports = { getMeta, setMeta };
