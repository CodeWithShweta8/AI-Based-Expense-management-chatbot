const {
  createExpense,
  getExpensesByUser,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  createExpenseSplit,
  getExpenseSplits,
  deleteExpenseSplits
} = require('../models/expense');

const getExpenses = async (req, res) => {
  try {
    const expenses = await getExpensesByUser(req.user.id);
    
    // Get splits for each expense
    const expensesWithSplits = await Promise.all(
      expenses.map(async (expense) => {
        const splits = await getExpenseSplits(expense.id);
        return { ...expense, splits };
      })
    );

    res.json({ expenses: expensesWithSplits });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllExpensesForAdmin = async (req, res) => {
  try {
    const expenses = await getAllExpenses();
    
    // Get splits for each expense
    const expensesWithSplits = await Promise.all(
      expenses.map(async (expense) => {
        const splits = await getExpenseSplits(expense.id);
        return { ...expense, splits };
      })
    );

    res.json({ 
      message: 'All expenses retrieved successfully',
      expenses: expensesWithSplits,
      total_count: expensesWithSplits.length
    });
  } catch (error) {
    console.error('Get all expenses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createExpenseWithSplit = async (req, res) => {
  try {
    const { description, total_amount, status, splits } = req.body;

    if (!description || !total_amount) {
      return res.status(400).json({ error: 'Description and total amount are required' });
    }

    // Create the expense
    const expense = await createExpense({
      description,
      total_amount,
      status,
      created_by: req.user.id
    });

    // Handle splits
    if (splits && splits.length > 0) {
      // Validate that splits sum equals total amount
      const splitSum = splits.reduce((sum, split) => sum + parseFloat(split.amount), 0);
      if (Math.abs(splitSum - parseFloat(total_amount)) > 0.01) {
        return res.status(400).json({ error: 'Split amounts must equal total amount' });
      }

      // Create splits
      await Promise.all(
        splits.map(split => 
          createExpenseSplit({
            expense_id: expense.id,
            user_id: split.user_id,
            amount: split.amount
          })
        )
      );
    } else {
      // Equal split with creator
      await createExpenseSplit({
        expense_id: expense.id,
        user_id: req.user.id,
        amount: total_amount
      });
    }

    // Get the created expense with splits
    const createdSplits = await getExpenseSplits(expense.id);
    
    res.status(201).json({
      message: 'Expense created successfully',
      expense: { ...expense, splits: createdSplits }
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, total_amount, status, splits } = req.body;

    if (!description || !total_amount) {
      return res.status(400).json({ error: 'Description and total amount are required' });
    }

    // Check if expense exists and user owns it
    const existingExpense = await getExpenseById(id);
    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (existingExpense.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this expense' });
    }

    const updatedExpense = await updateExpense(id, { description, total_amount, status });
    
    // Handle splits
    if (splits && Array.isArray(splits)) {
      const splitSum = splits.reduce((sum, split) => sum + parseFloat(split.amount), 0);
      if (splits.length > 0 && Math.abs(splitSum - parseFloat(total_amount)) > 0.01) {
        return res.status(400).json({ error: 'Split amounts must equal total amount' });
      }
      
      await deleteExpenseSplits(id);
      
      if (splits.length > 0) {
        await Promise.all(
          splits.map(split => 
            createExpenseSplit({
              expense_id: id,
              user_id: split.user_id,
              amount: split.amount
            })
          )
        );
      } else {
        // Equal split with creator if empty
        await createExpenseSplit({
          expense_id: id,
          user_id: req.user.id,
          amount: total_amount
        });
      }
    }

    const newSplits = await getExpenseSplits(id);

    res.json({
      message: 'Expense updated successfully',
      expense: { ...updatedExpense, splits: newSplits }
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if expense exists and user owns it
    const existingExpense = await getExpenseById(id);
    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (existingExpense.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this expense' });
    }

    await deleteExpense(id);

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const splitExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { splits } = req.body;

    if (!splits || !Array.isArray(splits) || splits.length === 0) {
      return res.status(400).json({ error: 'Splits array is required' });
    }

    // Check if expense exists
    const expense = await getExpenseById(id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Validate that splits sum equals total amount
    const splitSum = splits.reduce((sum, split) => sum + parseFloat(split.amount), 0);
    if (Math.abs(splitSum - parseFloat(expense.total_amount)) > 0.01) {
      return res.status(400).json({ error: 'Split amounts must equal total amount' });
    }

    // Delete existing splits and create new ones
    await deleteExpenseSplits(id);
    await Promise.all(
      splits.map(split => 
        createExpenseSplit({
          expense_id: id,
          user_id: split.user_id,
          amount: split.amount
        })
      )
    );

    const newSplits = await getExpenseSplits(id);

    res.json({
      message: 'Expense split successfully',
      expense: { ...expense, splits: newSplits }
    });
  } catch (error) {
    console.error('Split expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getExpenses,
  getAllExpensesForAdmin,
  createExpenseWithSplit,
  updateExpenseById,
  deleteExpenseById,
  splitExpense
}; 