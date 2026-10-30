const pool = require('../../config/db');

const createExpense = async (expense) => {
  const { description, total_amount, status, created_by } = expense;
  const result = await pool.query(
    'INSERT INTO expenses (description, total_amount, status, created_by) VALUES ($1, $2, COALESCE($3, \'pending\'), $4) RETURNING *',
    [description, total_amount, status, created_by]
  );
  return result.rows[0];
};

const getExpensesByUser = async (userId) => {
  const result = await pool.query(`
    SELECT DISTINCT e.*, u.name as created_by_name 
    FROM expenses e 
    LEFT JOIN users u ON e.created_by = u.id
    LEFT JOIN expense_splits es ON e.id = es.expense_id
    WHERE e.created_by = $1 OR es.user_id = $1
    ORDER BY e.created_at DESC
  `, [userId]);
  return result.rows;
};

const getAllExpenses = async () => {
  const result = await pool.query(`
    SELECT e.*, u.name as created_by_name, u.email as created_by_email
    FROM expenses e 
    LEFT JOIN users u ON e.created_by = u.id
    ORDER BY e.created_at DESC
  `);
  return result.rows;
};

const getExpenseById = async (id) => {
  const result = await pool.query('SELECT * FROM expenses WHERE id = $1', [id]);
  return result.rows[0];
};

const updateExpense = async (id, expense) => {
  const { description, total_amount, status } = expense;
  const result = await pool.query(
    'UPDATE expenses SET description = $1, total_amount = $2, status = COALESCE($3, status) WHERE id = $4 RETURNING *',
    [description, total_amount, status, id]
  );
  return result.rows[0];
};

const deleteExpense = async (id) => {
  await pool.query('DELETE FROM expense_splits WHERE expense_id = $1', [id]);
  const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};

const createExpenseSplit = async (split) => {
  const { expense_id, user_id, amount } = split;
  const result = await pool.query(
    'INSERT INTO expense_splits (expense_id, user_id, amount) VALUES ($1, $2, $3) RETURNING *',
    [expense_id, user_id, amount]
  );
  return result.rows[0];
};

const getExpenseSplits = async (expenseId) => {
  const result = await pool.query(`
    SELECT es.*, u.name as user_name, u.email as user_email 
    FROM expense_splits es 
    JOIN users u ON es.user_id = u.id 
    WHERE es.expense_id = $1
  `, [expenseId]);
  return result.rows;
};

const deleteExpenseSplits = async (expenseId) => {
  await pool.query('DELETE FROM expense_splits WHERE expense_id = $1', [expenseId]);
};

  const getUserExpensesSummary = async (userId) => {
  const result = await pool.query(`
    SELECT 
      COUNT(DISTINCT e.id) as total_expenses_created,
      COALESCE(SUM(DISTINCT e.total_amount), 0) as total_amount_created,
      COUNT(DISTINCT es.expense_id) as total_expenses_involved,
      COALESCE(SUM(es.amount), 0) as total_amount_owed
    FROM users u
    LEFT JOIN expenses e ON u.id = e.created_by
    LEFT JOIN expense_splits es ON u.id = es.user_id
    WHERE u.id = $1
  `, [userId]);
  return result.rows[0];
};

const checkUserPendingExpenses = async (userId) => {
  // Check if user has created any expenses
  const createdExpenses = await pool.query(
    'SELECT COUNT(*) as count FROM expenses WHERE created_by = $1',
    [userId]
  );
  
  // Check if user is involved in any expense splits
  const involvedExpenses = await pool.query(
    'SELECT COUNT(*) as count FROM expense_splits WHERE user_id = $1',
    [userId]
  );
  
  return {
    createdExpenses: parseInt(createdExpenses.rows[0].count),
    involvedExpenses: parseInt(involvedExpenses.rows[0].count),
    hasPendingExpenses: parseInt(createdExpenses.rows[0].count) > 0 || parseInt(involvedExpenses.rows[0].count) > 0
  };
};

const deleteAllUserExpenses = async (userId) => {
  // Delete all splits where user is involved
  await pool.query('DELETE FROM expense_splits WHERE user_id = $1', [userId]);
  
  // Delete all expenses created by user (this will cascade to splits via FK)
  await pool.query('DELETE FROM expenses WHERE created_by = $1', [userId]);
};

module.exports = {
  createExpense,
  getExpensesByUser,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  createExpenseSplit,
  getExpenseSplits,
  deleteExpenseSplits,
  getUserExpensesSummary,
  checkUserPendingExpenses,
  deleteAllUserExpenses
}; 