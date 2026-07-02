const { getClient } = require('./db');
const config = require('../config');

function deepMerge(target, source) {
  const out = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object'
    ) {
      out[key] = deepMerge(target[key], source[key]);
    } else {
      out[key] = source[key];
    }
  }
  return out;
}

async function getSettings(groupId) {
  const db = getClient();
  const res = await db.execute({
    sql: 'SELECT settings_json FROM group_settings WHERE group_id = ?',
    args: [groupId],
  });

  if (!res.rows.length) {
    const fresh = JSON.parse(JSON.stringify(config.defaultGroupSettings));
    await db.execute({
      sql: 'INSERT INTO group_settings (group_id, settings_json) VALUES (?, ?)',
      args: [groupId, JSON.stringify(fresh)],
    });
    return fresh;
  }

  const stored = JSON.parse(res.rows[0].settings_json);
  // pastikan field baru dari default settings ikut ter-merge (kalau bot di-update)
  return deepMerge(config.defaultGroupSettings, stored);
}

async function updateSettings(groupId, partial) {
  const current = await getSettings(groupId);
  const updated = deepMerge(current, partial);
  const db = getClient();
  await db.execute({
    sql: `
      INSERT INTO group_settings (group_id, settings_json) VALUES (?, ?)
      ON CONFLICT(group_id) DO UPDATE SET settings_json = excluded.settings_json
    `,
    args: [groupId, JSON.stringify(updated)],
  });
  return updated;
}

async function listGroupIds() {
  const db = getClient();
  const res = await db.execute('SELECT group_id FROM group_settings');
  return res.rows.map((r) => r.group_id);
}

module.exports = { getSettings, updateSettings, listGroupIds };
