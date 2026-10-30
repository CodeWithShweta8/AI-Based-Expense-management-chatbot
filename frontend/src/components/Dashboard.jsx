import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Avatar,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  Group as GroupIcon,
  AttachMoney as MoneyIcon,
  AccountBalance as BalanceIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user, apiClient } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/expenses');
      setExpenses(res.data.expenses || res.data);
    } catch (err) {
      console.error('Failed to fetch expenses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute statistics
  const totalExpenses = expenses.length;
  const totalAmount = expenses.reduce((sum, e) => sum + (parseFloat(e.total_amount ?? e.amount ?? 0) || 0), 0);
  const pendingSplits = expenses.filter((e) => e.status === 'pending').length;
  const groupExpenses = expenses.filter((e) => (e.splits?.length || 0) > 1).length;

  const stats = [
    {
      title: 'Total Expenses',
      value: totalExpenses,
      icon: <ReceiptIcon />,
      color: 'primary',
    },
    {
      title: 'Total Amount',
      value: `Rs ${totalAmount.toFixed(2)}`,
      icon: <MoneyIcon />,
      color: 'success',
    },
    {
      title: 'Pending Splits',
      value: pendingSplits,
      icon: <AssignmentIcon />,
      color: 'warning',
    },
    {
      title: 'Group Expenses',
      value: groupExpenses,
      icon: <GroupIcon />,
      color: 'info',
    },
  ];

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))
    .slice(0, 5);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: 'bold', color: 'primary.main' }}
        >
          Welcome back, {user?.name || 'User'}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's your expense overview
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Statistics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {stats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  elevation={3}
                  sx={{
                    height: '100%',
                    background: `linear-gradient(135deg, ${stat.color === 'primary'
                      ? '#1976d2'
                      : stat.color === 'success'
                        ? '#2e7d32'
                        : stat.color === 'warning'
                          ? '#ed6c02'
                          : '#0288d1'} 0%, ${stat.color === 'primary'
                            ? '#42a5f5'
                            : stat.color === 'success'
                              ? '#66bb6a'
                              : stat.color === 'warning'
                                ? '#ffb74d'
                                : '#29b6f6'} 100%)`,
                    color: 'white',
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6" component="div">
                        {stat.title}
                      </Typography>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>{stat.icon}</Avatar>
                    </Box>
                    <Typography
                      variant="h3"
                      component="div"
                      sx={{ fontWeight: 'bold', mb: 1 }}
                    >
                      {stat.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3}>
            {/* Recent Expenses */}
            <Grid item xs={12} md={8}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ display: 'flex', alignItems: 'center', mb: 3 }}
                    >
                      <ReceiptIcon sx={{ mr: 1 }} /> Recent Expenses
                    </Typography>
                    <IconButton size="small" onClick={fetchData}>
                      <RefreshIcon />
                    </IconButton>
                  </Box>
                  <List>
                    {recentExpenses.length === 0 ? (
                      <Typography color="text.secondary" sx={{ ml: 1 }}>
                        No expenses yet.
                      </Typography>
                    ) : (
                      recentExpenses.map((expense, index) => (
                        <React.Fragment key={expense.id || expense._id}>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <ReceiptIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={expense.title}
                              secondary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {new Date(expense.created_at || expense.date).toLocaleDateString()}
                                  </Typography>
                                  {expense.splits && expense.splits.length > 1 && (
                                    <Typography variant="body2" color="text.secondary">
                                      • {expense.splits.length} participants
                                    </Typography>
                                  )}
                                  <Chip
                                    label={expense.status}
                                    size="small"
                                    color={getStatusColor(expense.status)}
                                  />
                                </Box>
                              }
                            />
                            <Typography
                              variant="h6"
                              color="primary.main"
                              sx={{ fontWeight: 'bold' }}
                            >
                              Rs {(parseFloat(expense.total_amount ?? expense.amount ?? 0) || 0).toFixed(2)}
                            </Typography>
                          </ListItem>
                          {index < recentExpenses.length - 1 && <Divider />}
                        </React.Fragment>
                      ))
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Monthly Summary (placeholder linear progress based on totals) */}
            <Grid item xs={12} md={4}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Card elevation={3}>
                    <CardContent>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                      >
                        <TrendingUpIcon sx={{ mr: 1 }} /> This Month
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Spending Progress
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={totalAmount === 0 ? 0 : Math.min((totalAmount / 10000) * 100, 100)}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Rs {totalAmount.toFixed(2)} spent of Rs 10,000 budget
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card elevation={3} sx={{ bgcolor: 'success.main', color: 'white' }}>
                    <CardContent>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ display: 'flex', alignItems: 'center' }}
                      >
                        <BalanceIcon sx={{ mr: 1 }} /> Total Amount
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        Rs {totalAmount.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Across all expenses
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Dashboard; 