const pool = require('../../config/db');

const createUser = async (user) => {
  const { name, email, password_hash, role } = user;
  const result = await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, email, password_hash, role]
  );
  return result.rows[0];
};

const getUserByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

const getUserById = async (id) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
};

const getAllUsers = async () => {
  const result = await pool.query('SELECT id, name, email, role, profile_picture, created_at FROM users ORDER BY created_at DESC');
  return result.rows;
};

const deleteUser = async (id) => {
  const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};

const updateUser = async (id, updates) => {
  const fields = [];
  const values = [];
  let idx = 1;

  if (updates.name) {
    fields.push(`name = $${idx++}`);
    values.push(updates.name);
  }

  if (updates.email) {
    fields.push(`email = $${idx++}`);
    values.push(updates.email);
  }

  if (updates.role) {
    fields.push(`role = $${idx++}`);
    values.push(updates.role);
  }

  if (updates.profile_picture !== undefined) {
    fields.push(`profile_picture = $${idx++}`);
    values.push(updates.profile_picture);
  }

  if (updates.password_hash) {
    fields.push(`password_hash = $${idx++}`);
    values.push(updates.password_hash);
  }

  if (fields.length === 0) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
  values.push(id);

  const result = await pool.query(query, values);
  return result.rows[0];
};

module.exports = { 
  createUser, 
  getUserByEmail, 
  getUserById, 
  getAllUsers, 
  deleteUser, 
  updateUser 
}; 