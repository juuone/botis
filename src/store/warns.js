const { getClient } = require('./db');

// Data disimpan per grup -> per JID (nomor) user, BUKAN per nama,
// supaya tidak ketuker walau push name sama/berubah-ubah.

async function getUserWarn(groupId, userJid) {
  const db = getClient();
  const res = await db.execute({
    sql: 'SELECT count, history_json FROM warns WHERE group_id = ? AND user_jid = ?',
    args: [groupId, userJid],
  });
  if (!res.rows.length) return { count: 0, history: [] };
  return { count: res.rows[0].count, history: JSON.parse(res.rows[0].history_json) };
}

async function addWarn(groupId, userJid, type, reason = '') {
  const db = getClient();
  const current = await getUserWarn(groupId, userJid);
  current.count += 1;
  current.history.push({ type, reason, date: new Date().toISOString() });

  await db.execute({
    sql: `
      INSERT INTO warns (group_id, user_jid, count, history_json) VALUES (?, ?, ?, ?)
      ON CONFLICT(group_id, user_jid) DO UPDATE SET count = excluded.count, history_json = excluded.history_json
    `,
    args: [groupId, userJid, current.count, JSON.stringify(current.history)],
  });

  return current;
}

async function resetWarn(groupId, userJid) {
  const db = getClient();
  await db.execute({
    sql: 'DELETE FROM warns WHERE group_id = ? AND user_jid = ?',
    args: [groupId, userJid],
  });
}

async function listWarns(groupId) {
  const db = getClient();
  const res = await db.execute({
    sql: 'SELECT user_jid, count, history_json FROM warns WHERE group_id = ?',
    args: [groupId],
  });
  const out = {};
  for (const row of res.rows) {
    out[row.user_jid] = { count: row.count, history: JSON.parse(row.history_json) };
  }
  return out;
}

module.exports = { getUserWarn, addWarn, resetWarn, listWarns };
