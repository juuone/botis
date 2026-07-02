const { getClient } = require('./db');

async function setShaderLink(version, variant, link) {
  const db = getClient();
  await db.execute({
    sql: `
      INSERT INTO shaders (version, variant, link) VALUES (?, ?, ?)
      ON CONFLICT(version, variant) DO UPDATE SET link = excluded.link
    `,
    args: [version, variant, link],
  });
}

async function deleteShaderLink(version, variant) {
  const db = getClient();
  await db.execute({
    sql: 'DELETE FROM shaders WHERE version = ? AND variant = ?',
    args: [version, variant],
  });
}

async function getShaderLink(version, variant) {
  const db = getClient();
  const res = await db.execute({
    sql: 'SELECT link FROM shaders WHERE version = ? AND variant = ?',
    args: [version, variant],
  });
  return res.rows.length ? res.rows[0].link : null;
}

async function listShaderVersions() {
  const db = getClient();
  const res = await db.execute('SELECT DISTINCT version FROM shaders ORDER BY version DESC');
  return res.rows.map((r) => r.version);
}

async function listAllShaders() {
  const db = getClient();
  const res = await db.execute('SELECT version, variant, link FROM shaders ORDER BY version DESC, variant ASC');
  return res.rows;
}

module.exports = { setShaderLink, deleteShaderLink, getShaderLink, listShaderVersions, listAllShaders };
