const express = require('express');
const { addUser, getAllUsersWithExpenses, deleteUserById, getProfile, updateProfile, updateUserById, getParticipantUsers, uploadAvatar, changePassword } = require('../controllers/userController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Add new user (Admin only)
 *     description: Create a new user account. Only accessible by admin users.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *           example:
 *             name: "John Doe"
 *             email: "john@example.com"
 *             password: "password123"
 *             role: "user"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
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
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email already exists
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
router.post('/', authenticateToken, requireAdmin, addUser);

/**
 * @swagger
 * /api/users/all:
 *   get:
 *     summary: Get all users with expense summary (Admin only)
 *     description: Retrieve all users with their expense statistics. Only accessible by admin users.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                       expense_summary:
 *                         type: object
 *                         properties:
 *                           total_expenses_created:
 *                             type: integer
 *                           total_amount_created:
 *                             type: number
 *                           total_expenses_involved:
 *                             type: integer
 *                           total_amount_owed:
 *                             type: number
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
router.get('/all', authenticateToken, requireAdmin, getAllUsersWithExpenses);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get user profile
 *     description: Get current user's profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
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
router.get('/me', authenticateToken, getProfile);

/**
 * @swagger
 * /api/users/change-password:
 *   put:
 *     summary: Change user password
 *     description: Update current user's password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Incorrect current password
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/change-password', authenticateToken, changePassword);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update user profile
 *     description: Update current user's profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated user name
 *           example:
 *             name: "John Updated"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Name is required
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
router.put('/me', authenticateToken, updateProfile);

/**
 * @swagger
 * /api/users/me/avatar:
 *   post:
 *     summary: Upload user profile picture
 *     description: Uploads a profile picture for the current user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture updated successfully
 *       400:
 *         description: No image uploaded
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/me/avatar', authenticateToken, upload.single('avatar'), uploadAvatar);

/**
 * @swagger
 * /api/users/participants:
 *   get:
 *     summary: Get all non-admin users
 *     description: Retrieve all users except admins. Accessible to any authenticated user.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Token required
 *       500:
 *         description: Internal server error
 */
router.get('/participants', authenticateToken, getParticipantUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     description: Delete a user. Checks for pending expenses and allows force deletion.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to delete
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               force:
 *                 type: boolean
 *                 default: false
 *                 description: Force delete user and all related expenses
 *           example:
 *             force: true
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: User has pending expenses or cannot delete own account
 *       401:
 *         description: Unauthorized - Token required
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authenticateToken, requireAdmin, deleteUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user (Admin only)
 *     description: Update an existing user's information. Only accessible by admin users.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, role]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - Token required
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', authenticateToken, requireAdmin, updateUserById);

module.exports = router; 