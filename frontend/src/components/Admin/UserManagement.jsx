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
  IconButton,
  CircularProgress,
  TextField,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  InputAdornment,
  Select,
  MenuItem as SelectItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const UserManagement = () => {
  const { apiClient, user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const [editDialog, setEditDialog] = useState({ open: false, user: null, name:'', email:'', role:'' });
  
  // New Add User State
  const [addDialog, setAddDialog] = useState({ open: false, name: '', email: '', password: '', role: 'user' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/users/all');
      setUsers(response.data.users || response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      alert(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (user) => {
    setDeleteDialog({ open: true, user });
  };

  const confirmDelete = async () => {
    const { user } = deleteDialog;
    if (!user) return;
    try {
      await apiClient.delete(`/users/${user.id || user._id}`, { data: { force: true } });
      setDeleteDialog({ open: false, user: null });
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const getRoleColor = (role) => (role === 'admin' ? 'error' : 'primary');

  const openEdit = (u)=>{
    setEditDialog({ open:true, user:u, name:u.name, email:u.email, role:u.role });
  };

  const saveEdit = async ()=>{
    const { user,name,email,role } = editDialog;
    try{
      await apiClient.put(`/users/${user.id || user._id}`,{ name, email, role });
      setEditDialog({ open:false, user:null, name:'', email:'', role:'' });
      fetchUsers();
    }catch(err){ alert(err.response?.data?.message || 'Failed to update user'); }
  };

  const handleAddUser = async () => {
    const { name, email, password, role } = addDialog;
    if (!name || !email || !password) {
      alert("Name, email, and password are required.");
      return;
    }
    try {
      await apiClient.post(`/users`, { name, email, password, role });
      setAddDialog({ open: false, name: '', email: '', password: '', role: 'user' });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || 'Failed to add user');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          User Management
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            size="small"
            placeholder="Search users..."
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
          <Tooltip title="Refresh">
            <IconButton onClick={fetchUsers}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button 
            variant="contained" 
            startIcon={<PersonAddIcon />} 
            onClick={() => setAddDialog({ ...addDialog, open: true })}
            sx={{ ml: 1 }}
          >
            Add User
          </Button>
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
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Total Expenses</TableCell>
                <TableCell>Total Amount Owed</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id || user._id}>
                    <TableCell>{user.id || user._id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip label={user.role} size="small" color={getRoleColor(user.role)} />
                    </TableCell>
                    <TableCell>{user.expense_summary?.total_expenses_involved || 0}</TableCell>
                    <TableCell>Rs {(user.expense_summary?.total_amount_owed || 0).toFixed(2)}</TableCell>
                    <TableCell align="center">
                      { (user.id ?? user._id) !== (currentUser.id ?? currentUser._id) && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton onClick={()=>openEdit(user)} size="small" sx={{mr:1}}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton onClick={() => handleDelete(user)} size="small" color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, user: null })}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          Are you sure you want to delete user "{deleteDialog.user?.name}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, user: null })}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={()=>setEditDialog({ ...editDialog, open:false })}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent sx={{display:'flex',flexDirection:'column',gap:2, mt:1}}>
          <TextField label="Name" value={editDialog.name} onChange={(e)=>setEditDialog({...editDialog,name:e.target.value})}/>
          <TextField label="Email" value={editDialog.email} onChange={(e)=>setEditDialog({...editDialog,email:e.target.value})}/>
          <FormControl>
            <InputLabel>Role</InputLabel>
            <Select value={editDialog.role} label="Role" onChange={(e)=>setEditDialog({...editDialog,role:e.target.value})}>
              <SelectItem value="user">user</SelectItem>
              <SelectItem value="admin">admin</SelectItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setEditDialog({...editDialog,open:false})}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit}>Save</Button>
        </DialogActions>
      </Dialog>
      
      {/* Add User Dialog */}
      <Dialog open={addDialog.open} onClose={() => setAddDialog({ ...addDialog, open: false })}>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: '400px' }}>
          <TextField 
            label="Name" 
            required 
            value={addDialog.name} 
            onChange={(e) => setAddDialog({ ...addDialog, name: e.target.value })} 
          />
          <TextField 
            label="Email" 
            type="email" 
            required 
            value={addDialog.email} 
            onChange={(e) => setAddDialog({ ...addDialog, email: e.target.value })} 
          />
          <TextField 
            label="Password" 
            type="password" 
            required 
            value={addDialog.password} 
            onChange={(e) => setAddDialog({ ...addDialog, password: e.target.value })} 
          />
          <FormControl>
            <InputLabel>Role</InputLabel>
            <Select 
              value={addDialog.role} 
              label="Role" 
              onChange={(e) => setAddDialog({ ...addDialog, role: e.target.value })}
            >
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog({ ...addDialog, open: false })}>Cancel</Button>
          <Button variant="contained" onClick={handleAddUser} color="primary">Create User</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement; 