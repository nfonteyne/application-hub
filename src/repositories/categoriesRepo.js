const pool = require('../db/pool');

async function findAll() {
  const { rows } = await pool.query('SELECT id, name, position FROM app_categories ORDER BY position, name');
  return rows;
}

async function create({ name, position }) {
  const { rows } = await pool.query(
    'INSERT INTO app_categories (name, position) VALUES ($1, $2) RETURNING id, name, position',
    [name, position || 0]
  );
  return rows[0];
}

async function update(id, { name, position }) {
  const { rows } = await pool.query(
    'UPDATE app_categories SET name = $2, position = $3 WHERE id = $1 RETURNING id, name, position',
    [id, name, position || 0]
  );
  return rows[0] || null;
}

// Apps in this category fall back to uncategorized (ON DELETE SET NULL on apps.category_id).
async function remove(id) {
  await pool.query('DELETE FROM app_categories WHERE id = $1', [id]);
}

module.exports = { findAll, create, update, remove };
