const { createUser, getUserById, getAllUsers, deleteUser, updateUser } = require('../models/user');
const { getUserExpensesSummary, checkUserPendingExpenses, deleteAllUserExpenses } = require('../models/expense');
const { hashPassword } = require('../utils/auth');

const addUser = async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const hashedPassword = await hashPassword(password);
    const user = await createUser({
      name,
      email,
      password_hash: hashedPassword,
      role
    });

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Add user error:', error);
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllUsersWithExpenses = async (req, res) => {
  try {
    const users = await getAllUsers();
    
    // Get expense summary for each user
    const usersWithExpenses = await Promise.all(
      users.map(async (user) => {
        const expenseSummary = await getUserExpensesSummary(user.id);
        return {
          ...user,
          expense_summary: {
            total_expenses_created: parseInt(expenseSummary.total_expenses_created) || 0,
            total_amount_created: parseFloat(expenseSummary.total_amount_created) || 0,
            total_expenses_involved: parseInt(expenseSummary.total_expenses_involved) || 0,
            total_amount_owed: parseFloat(expenseSummary.total_amount_owed) || 0
          }
        };
      })
    );

    res.json({ 
      message: 'Users retrieved successfully',
      users: usersWithExpenses 
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { force = false } = req.body; // Allow force deletion

    // Check if user exists
    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check for pending expenses
    const expenseCheck = await checkUserPendingExpenses(id);
    
    if (expenseCheck.hasPendingExpenses && !force) {
      return res.status(400).json({ 
        error: 'User has pending expenses. Please clear all expenses first or use force deletion.',
        details: {
          createdExpenses: expenseCheck.createdExpenses,
          involvedExpenses: expenseCheck.involvedExpenses,
          message: 'Set "force": true in request body to delete user and all related expenses'
        }
      });
    }

    // If force deletion or no pending expenses, proceed
    if (force && expenseCheck.hasPendingExpenses) {
      // Delete all user's expenses and splits
      await deleteAllUserExpenses(id);
    }

    // Delete the user
    const deletedUser = await deleteUser(id);
    
    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = deletedUser;

    res.json({
      message: force && expenseCheck.hasPendingExpenses 
        ? 'User and all related expenses deleted successfully' 
        : 'User deleted successfully',
      user: userWithoutPassword,
      deleted_expenses: force ? expenseCheck : null
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const { password_hash, ...userWithoutPassword } = req.user;
    const expenseSummary = await getUserExpensesSummary(req.user.id);
    
    userWithoutPassword.expense_summary = {
      total_expenses_created: parseInt(expenseSummary.total_expenses_created) || 0,
      total_amount_created: parseFloat(expenseSummary.total_amount_created) || 0,
      total_expenses_involved: parseInt(expenseSummary.total_expenses_involved) || 0,
      total_amount_owed: parseFloat(expenseSummary.total_amount_owed) || 0
    };

    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name && !email) {
      return res.status(400).json({ error: 'Name or email is required' });
    }

    const updatedUser = await updateUser(req.user.id, { name, email });
    const { password_hash, ...userWithoutPassword } = updatedUser;

    res.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    if (!name && !email && !role) {
      return res.status(400).json({ error: 'At least one field (name, email, role) is required' });
    }

    // Prevent non-admin role changes by normal admins (role change allowed only by superadmin maybe) but we allow here

    const user = await getUserById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updatedUser = await updateUser(id, { name, email, role });
    const { password_hash, ...userWithoutPassword } = updatedUser;

    res.json({ message: 'User updated successfully', user: userWithoutPassword });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getParticipantUsers = async (req, res) => {
  try {
    // Return all users except admins
    const users = await getAllUsers();
    const filtered = users.filter((u)=> u.role !== 'admin');
    res.json({ users: filtered });
  } catch (error) {
    console.error('Get participant users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const profilePicUrl = `/uploads/${req.file.filename}`;
    const updatedUser = await updateUser(req.user.id, { profile_picture: profilePicUrl });
    const { password_hash, ...userWithoutPassword } = updatedUser;

    res.json({
      message: 'Profile picture updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const { comparePassword } = require('../utils/auth');
    const isMatch = await comparePassword(currentPassword, req.user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    const hashedPassword = await hashPassword(newPassword);
    await updateUser(req.user.id, { password_hash: hashedPassword });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { 
  addUser, 
  getAllUsersWithExpenses, 
  deleteUserById, 
  getProfile, 
  updateProfile, 
  updateUserById,
  getParticipantUsers,
  uploadAvatar,
  changePassword
}; 