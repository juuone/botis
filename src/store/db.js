const { createClient } = require('@libsql/client');
const config = require('../config');
const logger = require('../logger');

let client = null;

function getClient() {
  if (client) return client;
  if (!config.turso.url) {
    throw new Error(
      'TURSO_DATABASE_URL belum diisi di .env. Buat database gratis di https://turso.tech lalu isi TURSO_DATABASE_URL & TURSO_AUTH_TOKEN.'
    );
  }
  client = createClient({
    url: config.turso.url,
    authToken: config.turso.authToken,
  });
  return client;
}

async function initDb() {
  const db = getClient();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS group_settings (
      group_id TEXT PRIMARY KEY,
      settings_json TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS warns (
      group_id TEXT NOT NULL,
      user_jid TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      history_json TEXT NOT NULL DEFAULT '[]',
      PRIMARY KEY (group_id, user_jid)
    )
  `);

  // Link shaders per versi Minecraft, per varian (vibrant / non-vibrant)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS shaders (
      version TEXT NOT NULL,
      variant TEXT NOT NULL CHECK (variant IN ('vibrant', 'nonvibrant')),
      link TEXT NOT NULL,
      PRIMARY KEY (version, variant)
    )
  `);

  // Info umum bot yang bisa diatur admin/owner (misal: versi Minecraft terbaru, link mcpatch.me)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS bot_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Owner tambahan yang ditambahkan lewat .setowner (JID persis, jadi tetap akurat walau WA pakai @lid)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS owners (
      jid TEXT PRIMARY KEY,
      added_by TEXT,
      added_at TEXT
    )
  `);

  logger.info('✅ Database Turso siap (tabel group_settings, warns, shaders, bot_meta, owners).');
}

module.exports = { getClient, initDb };
