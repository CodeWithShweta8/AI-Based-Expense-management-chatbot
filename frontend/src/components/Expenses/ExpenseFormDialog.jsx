import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  IconButton,
  Grid,
  Typography,
  Autocomplete,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const ExpenseFormDialog = ({ open, onClose, onSave, initialData }) => {
  const { apiClient, user: currentUser, isAdmin } = useAuth();

  const isEditMode = Boolean(initialData);

  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('pending');
  const [splitType, setSplitType] = useState('equal'); // equal | custom
  const [participants, setParticipants] = useState([{ user: null, amount: '' }]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  // Fetch existing users for dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await apiClient.get(isAdmin ? '/users/all' : '/users/participants');
        let list = res.data.users || res.data;
        setUsers(list);
      } catch (err) {
        console.error('Failed to fetch users', err);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description || '');
      setTotalAmount(initialData.total_amount || '');
      setStatus(initialData.status || 'pending');
      setDate(initialData.date ? initialData.date.substring(0, 10) : '');
      setSplitType(initialData.splitType || 'equal');
      if (initialData.splits && initialData.splits.length) {
        setParticipants(
          initialData.splits.map((s) => ({ user: { id: s.user_id, name: s.user_name, email: s.user_email }, amount: s.amount || '' }))
        );
      }
    } else {
      // reset form when dialog opens in create mode
      setDescription('');
      setTotalAmount('');
      setStatus('pending');
      setDate('');
      setSplitType('equal');
      setParticipants([{ user: null, amount: '' }]);
    }
  }, [initialData, open]);

  const handleParticipantChange = (index, field, value) => {
    setParticipants((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const addParticipant = () => {
    setParticipants((prev) => [...prev, { user: null, amount: '' }]);
  };

  const removeParticipant = (index) => {
    setParticipants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // Basic validation
    if (!description || !totalAmount) return;

    setLoading(true);
    try {
      const payload = {
        description,
        total_amount: parseFloat(totalAmount),
        status,
        splits:
          splitType === 'equal'
            ? participants
                .filter((p) => p.user)
                .map((p) => ({ user_id: p.user.id, amount: parseFloat(totalAmount) / participants.length }))
            : participants
                .filter((p) => p.user && p.amount)
                .map((p) => ({ user_id: p.user.id, amount: parseFloat(p.amount) })),
      };

      if (isEditMode) {
        await apiClient.put(`/expenses/${initialData.id}`, payload);
      } else {
        await apiClient.post('/expenses', payload);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save expense:', error);
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEditMode ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Description"
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Total Amount"
                fullWidth
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Date"
                type="date"
                fullWidth
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">Split Type</FormLabel>
            <RadioGroup
              row
              value={splitType}
              onChange={(e) => setSplitType(e.target.value)}
            >
              <FormControlLabel value="equal" control={<Radio />} label="Equal" />
              <FormControlLabel value="custom" control={<Radio />} label="Custom" />
            </RadioGroup>
          </FormControl>

          {participants.map((participant, index) => (
            <Box key={index} sx={{ mb: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
              {users.length > 0 ? (
                <Autocomplete
                  options={users}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  getOptionLabel={(option) => `${option.name} (${option.email})`}
                  value={participant.user}
                  onChange={(e, newVal) => handleParticipantChange(index, 'user', newVal)}
                  renderInput={(params) => <TextField {...params} label="Participant" size="small" />}
                  sx={{ flex: 1 }}
                />
              ) : (
                <TextField disabled label="Loading users..." sx={{ flex: 1 }} />
              )}
              {splitType === 'custom' && (
                <TextField
                  label="Amount"
                  type="number"
                  value={participant.amount}
                  onChange={(e) => handleParticipantChange(index, 'amount', e.target.value)}
                  sx={{ width: 120 }}
                />
              )}
              <IconButton onClick={() => removeParticipant(index)}>
                <RemoveIcon />
              </IconButton>
            </Box>
          ))}

          <Button startIcon={<AddIcon />} onClick={addParticipant} sx={{ mt: 1 }}>
            Add Participant
          </Button>

          {splitType === 'equal' && participants.length > 1 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Each participant will pay an equal share of the total amount.
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          {isEditMode ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExpenseFormDialog; 