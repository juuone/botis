const { getClient } = require('./db');

async function addOwner(jid, addedBy) {
  const db = getClient();
  await db.execute({
    sql: `
      INSERT INTO owners (jid, added_by, added_at) VALUES (?, ?, ?)
      ON CONFLICT(jid) DO NOTHING
    `,
    args: [jid, addedBy || null, new Date().toISOString()],
  });
}

async function removeOwner(jid) {
  const db = getClient();
  await db.execute({ sql: 'DELETE FROM owners WHERE jid = ?', args: [jid] });
}

async function listOwnerJids() {
  const db = getClient();
  const res = await db.execute('SELECT jid FROM owners');
  return res.rows.map((r) => r.jid);
}

async function isOwnerJid(jid) {
  const db = getClient();
  const res = await db.execute({ sql: 'SELECT 1 FROM owners WHERE jid = ?', args: [jid] });
  return res.rows.length > 0;
}

module.exports = { addOwner, removeOwner, listOwnerJids, isOwnerJid };
