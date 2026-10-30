const express = require('express');
const {
  getExpenses,
  getAllExpensesForAdmin,
  createExpenseWithSplit,
  updateExpenseById,
  deleteExpenseById,
  splitExpense
} = require('../controllers/expenseController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All expense routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: Get user expenses
 *     description: Retrieve all expenses for the authenticated user (created by user or user is in splits)
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expenses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 expenses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Expense'
 *       401:
 *         description: Unauthorized - Token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', getExpenses);

/**
 * @swagger
 * /api/expenses/all:
 *   get:
 *     summary: Get all expenses (Admin only)
 *     description: Retrieve all expenses in the system with splits. Only accessible by admin users.
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All expenses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 expenses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Expense'
 *                 total_count:
 *                   type: integer
 *                   description: Total number of expenses
 *       401:
 *         description: Unauthorized - Token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/all', requireAdmin, getAllExpensesForAdmin);

/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: Create new expense
 *     description: Create a new expense with optional splits
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateExpenseRequest'
 *           examples:
 *             simple_expense:
 *               summary: Simple expense (assigned to creator)
 *               value:
 *                 description: "Dinner at restaurant"
 *                 total_amount: 150.00
 *             expense_with_splits:
 *               summary: Expense with custom splits
 *               value:
 *                 description: "Groceries for house"
 *                 total_amount: 200.00
 *                 splits:
 *                   - user_id: 1
 *                     amount: 100.00
 *                   - user_id: 2
 *                     amount: 100.00
 *     responses:
 *       201:
 *         description: Expense created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 expense:
 *                   $ref: '#/components/schemas/Expense'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', createExpenseWithSplit);

/**
 * @swagger
 * /api/expenses/{id}:
 *   put:
 *     summary: Update expense
 *     description: Update an existing expense (only creator or admin can update)
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Expense ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [description, total_amount]
 *             properties:
 *               description:
 *                 type: string
 *                 description: Updated expense description
 *               total_amount:
 *                 type: number
 *                 format: decimal
 *                 description: Updated total amount
 *           example:
 *             description: "Updated dinner expense"
 *             total_amount: 175.50
 *     responses:
 *       200:
 *         description: Expense updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 expense:
 *                   $ref: '#/components/schemas/Expense'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not authorized to update this expense
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Expense not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', updateExpenseById);

/**
 * @swagger
 * /api/expenses/{id}:
 *   delete:
 *     summary: Delete expense
 *     description: Delete an existing expense (only creator or admin can delete)
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Expense ID
 *     responses:
 *       200:
 *         description: Expense deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Expense deleted successfully"
 *       401:
 *         description: Unauthorized - Token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not authorized to delete this expense
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Expense not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', deleteExpenseById);

/**
 * @swagger
 * /api/expenses/{id}/split:
 *   post:
 *     summary: Split expense
 *     description: Split an expense among multiple users with custom amounts
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Expense ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SplitExpenseRequest'
 *           example:
 *             splits:
 *               - user_id: 1
 *                 amount: 300.00
 *               - user_id: 2
 *                 amount: 200.00
 *     responses:
 *       200:
 *         description: Expense split successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 expense:
 *                   $ref: '#/components/schemas/Expense'
 *       400:
 *         description: Invalid splits data or amounts don't match total
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Expense not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:id/split', splitExpense);

module.exports = router; 