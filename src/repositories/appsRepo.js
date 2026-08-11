const pool = require('../db/pool');

const BASE_SELECT = `
  SELECT a.id, a.name, a.description, a.url, a.icon, a.logo_object_key, a.required_group,
         a.category_id, c.name AS category_name, c.position AS category_position,
         a.position, a.created_at, a.updated_at
  FROM apps a
  LEFT JOIN app_categories c ON c.id = a.category_id
`;
// Uncategorized apps (category_position IS NULL) sort after every category.
const ORDER_BY = 'ORDER BY (c.position IS NULL), c.position, a.position, a.name';

async function findAll() {
  const { rows } = await pool.query(`${BASE_SELECT} ${ORDER_BY}`);
  return rows;
}

// Tiles visible to a given set of Authentik groups: no required_group (open
// to everyone), or a required_group the user is a member of.
async function findVisibleForGroups(groups) {
  const { rows } = await pool.query(
    `${BASE_SELECT} WHERE a.required_group IS NULL OR a.required_group = ANY($1::text[]) ${ORDER_BY}`,
    [groups || []]
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(`${BASE_SELECT} WHERE a.id = $1`, [id]);
  return rows[0] || null;
}

async function create({ name, description, url, icon, requiredGroup, categoryId, position, createdBy }) {
  const { rows } = await pool.query(
    `INSERT INTO apps (name, description, url, icon, required_group, category_id, position, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [name, description || null, url, icon || null, requiredGroup || null, categoryId || null, position || 0, createdBy || null]
  );
  return findById(rows[0].id);
}

async function update(id, { name, description, url, icon, requiredGroup, categoryId, position }) {
  const { rows } = await pool.query(
    `UPDATE apps
     SET name = $2, description = $3, url = $4, icon = $5, required_group = $6, category_id = $7, position = $8, updated_at = now()
     WHERE id = $1
     RETURNING id`,
    [id, name, description || null, url, icon || null, requiredGroup || null, categoryId || null, position || 0]
  );
  if (!rows[0]) return null;
  return findById(id);
}

async function setLogo(id, key) {
  await pool.query('UPDATE apps SET logo_object_key = $2, updated_at = now() WHERE id = $1', [id, key]);
  return findById(id);
}

async function clearLogo(id) {
  await pool.query('UPDATE apps SET logo_object_key = NULL, updated_at = now() WHERE id = $1', [id]);
  return findById(id);
}

async function remove(id) {
  await pool.query('DELETE FROM apps WHERE id = $1', [id]);
}

module.exports = { findAll, findVisibleForGroups, findById, create, update, setLogo, clearLogo, remove };
