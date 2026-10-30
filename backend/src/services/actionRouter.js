const { 
  createExpense, 
  getExpensesByUser, 
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  createExpenseSplit,
  getExpenseSplits,
  deleteExpenseSplits,
  getUserExpensesSummary
} = require('../models/expense');

const { 
  createUser, 
  getUserById, 
  getAllUsers, 
  updateUser, 
  deleteUser 
} = require('../models/user');

const bcrypt = require('bcrypt');

/**
 * Execute action based on intent with comprehensive error handling
 * @param {string} intent
 * @param {object} entities
 * @param {object} user - req.user object
 * @returns {Promise<string>} - message to return to user
 */
async function execute(intent, entities, user) {
  try {
    switch (intent) {
      case 'greeting':
        return await handleGreeting(entities, user);
      
      case 'help':
        return await handleHelp(entities, user);
      
      case 'create_expense':
        return await handleCreateExpense(entities, user);
      
      case 'list_expenses':
        return await handleListExpenses(entities, user);
      
      case 'delete_expense':
        return await handleDeleteExpense(entities, user);
      
      case 'update_expense':
        return await handleUpdateExpense(entities, user);
      
      case 'split_expense':
        return await handleSplitExpense(entities, user);
      
      case 'show_profile':
        return await handleShowProfile(entities, user);
      
      case 'update_profile':
        return await handleUpdateProfile(entities, user);
      
      case 'add_user':
        return await handleAddUser(entities, user);
      
      case 'list_users':
        return await handleListUsers(entities, user);
      
      default:
        return null;
    }
  } catch (error) {
    console.error(`Action execution error for intent ${intent}:`, error);
    return `❌ Sorry, I encountered an error while processing your request: ${error.message}`;
  }
}

/**
 * Handle greeting messages
 */
async function handleGreeting(entities, user) {
  const greetings = [
    `Hello ${user.name}! 👋 I'm here to help you manage your expenses.`,
    `Hi there ${user.name}! 😊 How can I assist you with your expense management today?`,
    `Good to see you, ${user.name}! 🎉 What would you like to do with your expenses?`,
    `Hello ${user.name}! 💼 I'm your expense management assistant. How can I help?`
  ];
  
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
  
  return `${randomGreeting}

Here are some things I can help you with:
• Create expenses: "Create expense lunch 25"
• List expenses: "Show my expenses"
• Split expenses: "Split expense 123 equally"
• View profile: "Show my profile"
• Delete expenses: "Delete expense 123"

What would you like to do?`;
}

/**
 * Handle help requests
 */
async function handleHelp(entities, user) {
  return `🤖 **Expense Management Assistant Help**

Hi ${user.name}! I'm designed to help you manage your expenses efficiently. Here's what I can do:

**💰 Expense Management:**
• Create expense: "Create expense lunch 25"
• List expenses: "Show my expenses"
• Delete expense: "Delete expense 123"
• Update expense: "Update expense 123 dinner 30"

**📊 Expense Splitting:**
• Split equally: "Split expense 123 equally"
• View splits: "Show split for expense 123"

**👤 Profile Management:**
• View profile: "Show my profile"
• Update name: "Update profile name John Doe"
• Update email: "Update profile email john@example.com"

${user.role === 'admin' ? `**🔧 Admin Features:**
• Add user: "Add user Jane Doe jane@example.com"
• List users: "Show all users"

` : ''}**💡 Tips:**
• Be specific with amounts and descriptions
• Include expense IDs for updates/deletions
• Use natural language - I understand various ways to ask

Need help with something specific? Just ask me!`;
}

/**
 * Handle create expense action
 */
async function handleCreateExpense(entities, user) {
  const { description, total_amount } = entities;
  
  if (!description || !total_amount) {
    return '❌ Please provide both description and amount. Example: "Create expense lunch 25"';
  }
  
  if (total_amount <= 0) {
    return '❌ Amount must be greater than 0';
  }
  
  const expense = await createExpense({
    description: description.trim(),
    total_amount: parseFloat(total_amount),
    created_by: user.id,
  });
  
  return `✅ Expense "${expense.description}" of $${expense.total_amount} created successfully (ID: ${expense.id})`;
}

/**
 * Handle list expenses action
 */
async function handleListExpenses(entities, user) {
  const expenses = await getExpensesByUser(user.id);
  
  if (expenses.length === 0) {
    return '📋 You have no expenses yet. Create one by saying "Create expense [description] [amount]"';
  }
  
  // Get summary
  const summary = await getUserExpensesSummary(user.id);
  
  let response = `📊 **Your Expenses Summary:**\n`;
  response += `• Total expenses created: ${summary.total_expenses_created}\n`;
  response += `• Total amount created: $${summary.total_amount_created}\n`;
  response += `• Total amount you owe: $${summary.total_amount_owed}\n\n`;
  
  response += `📋 **Recent Expenses:**\n`;
  const recentExpenses = expenses.slice(0, 10);
  
  for (const expense of recentExpenses) {
    const splits = await getExpenseSplits(expense.id);
    const splitStatus = splits.length > 0 ? `(Split among ${splits.length} people)` : '(Not split)';
    response += `• [${expense.id}] ${expense.description}: $${expense.total_amount} ${splitStatus}\n`;
  }
  
  if (expenses.length > 10) {
    response += `\n... and ${expenses.length - 10} more expenses`;
  }
  
  return response;
}

/**
 * Handle delete expense action
 */
async function handleDeleteExpense(entities, user) {
  const { id } = entities;
  
  if (!id) {
    return '❌ Please specify the expense ID to delete. Example: "Delete expense 123"';
  }
  
  // Check if expense exists and user has permission
  const expense = await getExpenseById(id);
  if (!expense) {
    return `❌ Expense with ID ${id} not found`;
  }
  
  if (expense.created_by !== user.id && user.role !== 'admin') {
    return `❌ You can only delete expenses you created`;
  }
  
  await deleteExpense(id);
  return `🗑️ Expense "${expense.description}" (ID: ${id}) deleted successfully`;
}

/**
 * Handle update expense action
 */
async function handleUpdateExpense(entities, user) {
  const { id, description, total_amount } = entities;
  
  if (!id) {
    return '❌ Please specify the expense ID to update. Example: "Update expense 123 new description 50"';
  }
  
  // Check if expense exists and user has permission
  const expense = await getExpenseById(id);
  if (!expense) {
    return `❌ Expense with ID ${id} not found`;
  }
  
  if (expense.created_by !== user.id && user.role !== 'admin') {
    return `❌ You can only update expenses you created`;
  }
  
  const updates = {};
  if (description) updates.description = description.trim();
  if (total_amount) updates.total_amount = parseFloat(total_amount);
  
  if (Object.keys(updates).length === 0) {
    return '❌ Please provide description and/or amount to update';
  }
  
  if (updates.total_amount && updates.total_amount <= 0) {
    return '❌ Amount must be greater than 0';
  }
  
  const updatedExpense = await updateExpense(id, updates);
  return `✅ Expense updated: "${updatedExpense.description}" - $${updatedExpense.total_amount}`;
}

/**
 * Handle split expense action
 */
async function handleSplitExpense(entities, user) {
  const { id, type } = entities;
  
  if (!id) {
    return '❌ Please specify the expense ID to split. Example: "Split expense 123 equally"';
  }
  
  // Check if expense exists and user has permission
  const expense = await getExpenseById(id);
  if (!expense) {
    return `❌ Expense with ID ${id} not found`;
  }
  
  if (expense.created_by !== user.id && user.role !== 'admin') {
    return `❌ You can only split expenses you created`;
  }
  
  // Check if already split
  const existingSplits = await getExpenseSplits(id);
  if (existingSplits.length > 0) {
    let response = `📊 Expense "${expense.description}" is already split:\n`;
    existingSplits.forEach(split => {
      response += `• ${split.user_name}: $${split.amount}\n`;
    });
    return response;
  }
  
  if (type === 'equal') {
    // For now, split equally between creator and one other user
    // In a real implementation, you'd ask which users to include
    const splitAmount = expense.total_amount / 2;
    
    // Delete existing splits
    await deleteExpenseSplits(id);
    
    // Create new splits
    await createExpenseSplit({
      expense_id: id,
      user_id: user.id,
      amount: splitAmount
    });
    
    return `✅ Expense "${expense.description}" split equally. Each person owes $${splitAmount}. To add more people to the split, please use the web interface.`;
  }
  
  return '❌ Custom splitting is not yet supported via chat. Please use the web interface for custom splits.';
}

/**
 * Handle show profile action
 */
async function handleShowProfile(entities, user) {
  const userProfile = await getUserById(user.id);
  const summary = await getUserExpensesSummary(user.id);
  
  let response = `👤 **Your Profile:**\n`;
  response += `• Name: ${userProfile.name}\n`;
  response += `• Email: ${userProfile.email}\n`;
  response += `• Role: ${userProfile.role}\n`;
  response += `• Member since: ${new Date(userProfile.created_at).toLocaleDateString()}\n\n`;
  
  response += `📊 **Expense Summary:**\n`;
  response += `• Expenses created: ${summary.total_expenses_created}\n`;
  response += `• Total amount created: $${summary.total_amount_created}\n`;
  response += `• Total amount you owe: $${summary.total_amount_owed}`;
  
  return response;
}

/**
 * Handle update profile action
 */
async function handleUpdateProfile(entities, user) {
  const { field, value } = entities;
  
  if (!field || !value) {
    return '❌ Please specify what to update. Example: "Update profile name John Doe" or "Update profile email john@example.com"';
  }
  
  if (field === 'name') {
    if (value.length < 2) {
      return '❌ Name must be at least 2 characters long';
    }
    await updateUser(user.id, { name: value });
    return `✅ Name updated to "${value}"`;
  }
  
  if (field === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return '❌ Please provide a valid email address';
    }
    await updateUser(user.id, { email: value });
    return `✅ Email updated to "${value}"`;
  }
  
  return '❌ You can only update name or email. Example: "Update profile name John Doe"';
}

/**
 * Handle add user action (admin only)
 */
async function handleAddUser(entities, user) {
  if (user.role !== 'admin') {
    return '❌ Only admins can add users';
  }
  
  const { name, email, role } = entities;
  
  if (!name || !email) {
    return '❌ Please provide name and email. Example: "Add user John Doe john@example.com"';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return '❌ Please provide a valid email address';
  }
  
  // Generate default password
  const defaultPassword = 'password123';
  const password_hash = await bcrypt.hash(defaultPassword, 10);
  
  const newUser = await createUser({
    name: name.trim(),
    email: email.toLowerCase(),
    password_hash,
    role: role === 'admin' ? 'admin' : 'user'
  });
  
  return `✅ User "${newUser.name}" created successfully!\n• Email: ${newUser.email}\n• Role: ${newUser.role}\n• Default password: ${defaultPassword}\n\n⚠️ Please ask the user to change their password after first login.`;
}

/**
 * Handle list users action (admin only)
 */
async function handleListUsers(entities, user) {
  if (user.role !== 'admin') {
    return '❌ Only admins can view all users';
  }

  // Fetch all users
  const users = await getAllUsers();

  if (!users || users.length === 0) {
    return '📋 No users found.';
  }

  let response = `👥 **All Users (${users.length}):**\n`;
  for (const u of users) {
    const summary = await getUserExpensesSummary(u.id);
    response += `• [${u.id}] ${u.name} (${u.email}) - ${u.role}\n`;
    response += `  Expenses: ${summary.total_expenses_created} created, $${summary.total_amount_owed} owed\n`;
  }
  return response;
}

module.exports = { execute };