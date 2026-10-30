import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  IconButton,
  Chip,
  TextField,
  Tooltip,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const AllExpenses = () => {
  const { apiClient } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/expenses/all');
      setExpenses(response.data.expenses || response.data);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      alert(error.response?.data?.message || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'completed':
      default: return 'success';
    }
  };

  const getStatus = (e) => e.status || 'completed';

  const getAmount = (e) => parseFloat(e.total_amount ?? e.amount ?? 0) || 0;

  const filteredExpenses = expenses.filter((e) => {
    const searchLower = search.toLowerCase();
    const splitUsers = (e.splits || []).map(s => s.user_name || '').join(' ').toLowerCase();
    const matchesSearch = 
      (e.description?.toLowerCase() || '').includes(searchLower) ||
      (e.created_by_name || '').toLowerCase().includes(searchLower) ||
      (e.userName || e.user_name || '').toLowerCase().includes(searchLower) ||
      (e.user?.name?.toLowerCase() || '').includes(searchLower) ||
      splitUsers.includes(searchLower);
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          All Expenses
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            size="small"
            placeholder="Search title or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchExpenses}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>User</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No expenses found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id || expense._id}>
                    <TableCell>{expense.id || expense._id}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>Rs {getAmount(expense).toFixed(2)}</TableCell>
                    <TableCell>{new Date(expense.created_at || expense.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip label={getStatus(expense)} size="small" color={getStatusColor(getStatus(expense))} />
                    </TableCell>
                    <TableCell>
                      {expense.splits && expense.splits.length > 0
                        ? expense.splits.map(s => s.user_name).join(', ')
                        : (expense.created_by_name || expense.userName || expense.user_name || expense.user?.name || 'N/A')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
};

export default AllExpenses; 