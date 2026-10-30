import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  CircularProgress,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import ExpenseFormDialog from './ExpenseFormDialog';

const MyExpenses = () => {
  const { apiClient } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, expense: null });

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/expenses');
      setExpenses(response.data.expenses || response.data); // adapt to backend response
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      setError(error.response?.data?.message || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleCreate = () => {
    setSelectedExpense(null);
    setFormOpen(true);
  };

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setFormOpen(true);
  };

  const handleDelete = (expense) => {
    setDeleteDialog({ open: true, expense });
  };

  const confirmDelete = async () => {
    const { expense } = deleteDialog;
    if (!expense) return;
    try {
      await apiClient.delete(`/expenses/${expense.id || expense._id}`);
      setDeleteDialog({ open: false, expense: null });
      fetchExpenses();
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert(error.response?.data?.message || 'Failed to delete expense');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'completed':
      default: return 'success';
    }
  };
  const getStatus = (e)=> e.status || 'completed';

  const getAmount = (expense) => parseFloat(expense.total_amount ?? expense.amount ?? 0) || 0;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          My Expenses
        </Typography>
        <Box>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchExpenses} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
            New Expense
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Paper>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No expenses found.
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense.id || expense._id}>
                    <TableCell>{expense.id || expense._id}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>Rs {getAmount(expense).toFixed(2)}</TableCell>
                    <TableCell>{new Date(expense.created_at || expense.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip label={getStatus(expense)} size="small" color={getStatusColor(getStatus(expense))} />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleEdit(expense)} size="small" sx={{ mr: 1 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleDelete(expense)} size="small" color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Expense Form Dialog */}
      {formOpen && (
        <ExpenseFormDialog
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSave={fetchExpenses}
          initialData={selectedExpense}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, expense: null })}>
        <DialogTitle>Delete Expense</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the expense "{deleteDialog.expense?.title}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, expense: null })}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyExpenses; 