import React, { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Avatar,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  Chip,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Lock as LockIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user, setUser, updateProfile: updateAuthProfile, apiClient } = useAuth();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' });
  const [changePasswordDialog, setChangePasswordDialog] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Form states
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    role: '',
    createdAt: '',
    lastLogin: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Load user data
  useEffect(() => {
    const loadFreshData = async () => {
      try {
        const res = await apiClient.get('/users/me');
        if(res.data?.user) setUser(res.data.user);
      } catch(err) {
        console.error('Failed to update stats', err);
      }
    };
    loadFreshData();
  }, [setUser]);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        createdAt: user.createdAt || '',
        lastLogin: user.lastLogin || '',
      });
    }
  }, [user]);

  // Handle profile update
  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const response = await updateAuthProfile({
        name: profileData.name,
        email: profileData.email,
      });

      if (response.success) {
        setAlert({
          show: true,
          message: 'Profile updated successfully!',
          severity: 'success'
        });
        setIsEditing(false);
      } else {
        setAlert({
          show: true,
          message: response.error || 'Failed to update profile',
          severity: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setAlert({
        show: true,
        message: 'New passwords do not match',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      await apiClient.put(
        '/users/change-password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }
      );

      setAlert({
        show: true,
        message: 'Password changed successfully!',
        severity: 'success'
      });
      setChangePasswordDialog(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setAlert({
        show: true,
        message: error.response?.data?.message || error.response?.data?.error || 'Failed to change password',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setPreviewImage(localUrl);

    const formData = new FormData();
    formData.append('avatar', file);

    setLoading(true);
    try {
      const response = await apiClient.post('/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      setUser(response.data.user);
      setAlert({ show: true, message: 'Profile picture updated successfully!', severity: 'success' });
    } catch (error) {
      setAlert({ show: true, message: error.response?.data?.error || 'Failed to upload image', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordInputChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get user initials for avatar
  const getUserInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'user': return 'primary';
      default: return 'default';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Alert */}
      {alert.show && (
        <Alert
          severity={alert.severity}
          onClose={() => setAlert({ show: false, message: '', severity: 'info' })}
          sx={{ mb: 3 }}
        >
          {alert.message}
        </Alert>
      )}

      {/* Header */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        My Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              {/* Avatar */}
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    fontSize: '2rem',
                    bgcolor: 'primary.main',
                    mb: 2
                  }}
                  src={previewImage || (user?.profile_picture ? `http://localhost:5000${user.profile_picture}` : undefined)}
                >
                  {!(previewImage || user?.profile_picture) && getUserInitials(profileData.name)}
                </Avatar>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                />
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'grey.100' }
                  }}
                  size="small"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  disabled={loading}
                >
                  <PhotoCameraIcon />
                </IconButton>
              </Box>

              {/* User Info */}
              <Typography variant="h5" gutterBottom>
                {profileData.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {profileData.email}
              </Typography>
              <Chip
                label={profileData.role.toUpperCase()}
                color={getRoleColor(profileData.role)}
                icon={profileData.role === 'admin' ? <AdminIcon /> : <PersonIcon />}
                sx={{ mb: 2 }}
              />

              {/* Action Buttons */}
              <Box sx={{ mt: 3 }}>
                {!isEditing ? (
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditing(true)}
                    fullWidth
                    sx={{ mb: 1 }}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <Box>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveProfile}
                      disabled={loading}
                      fullWidth
                      sx={{ mb: 1 }}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={() => setIsEditing(false)}
                      fullWidth
                    >
                      Cancel
                    </Button>
                  </Box>
                )}
                <Button
                  variant="outlined"
                  startIcon={<LockIcon />}
                  onClick={() => setChangePasswordDialog(true)}
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  Change Password
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Details */}
        <Grid item xs={12} md={8}>
          <Card elevation={3}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <PersonIcon sx={{ mr: 1 }} />
                Profile Information
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={profileData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    variant={isEditing ? 'outlined' : 'filled'}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    value={profileData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    variant={isEditing ? 'outlined' : 'filled'}
                    type="email"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Role"
                    value={profileData.role}
                    disabled
                    variant="filled"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Member Since"
                    value={formatDate(profileData.createdAt)}
                    disabled
                    variant="filled"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Account Statistics */}
              <Typography variant="h6" gutterBottom>
                Account Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, display: 'flex', justifyContent: 'space-around', alignItems: 'center', bgcolor: 'primary.light', color: 'white', borderRadius: 2 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{user?.expense_summary?.total_expenses_involved || 0}</Typography>
                      <Typography variant="body1">Total Expenses</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Rs {(user?.expense_summary?.total_amount_created || 0).toFixed(2)}</Typography>
                      <Typography variant="body1">Total Amount</Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordDialog} onClose={() => setChangePasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LockIcon sx={{ mr: 1 }} />
            Change Password
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Current Password"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleChangePassword} variant="contained" disabled={loading}>
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile; 