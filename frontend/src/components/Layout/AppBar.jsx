import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Button,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  Person,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const CustomAppBar = ({ onMenuClick, isMobile }) => {
  const { user, logout, isAdmin } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U';
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Expense Manager
            {isAdmin && (
              <Chip
                icon={<AdminPanelSettings />}
                label="Admin"
                size="small"
                sx={{
                  backgroundColor: 'secondary.main',
                  color: 'white',
                  '& .MuiChip-icon': { color: 'white' },
                }}
              />
            )}
          </Box>
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Welcome, {user?.name}
          </Typography>
          
          <Button
            color="inherit"
            onClick={handleMenuOpen}
            startIcon={
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'secondary.main',
                  fontSize: '0.875rem',
                }}
                src={user?.profile_picture ? `http://localhost:5000${user.profile_picture}` : undefined}
              >
                {!user?.profile_picture && getInitials(user?.name)}
              </Avatar>
            }
            sx={{ textTransform: 'none' }}
          >
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user?.name}
            </Box>
          </Button>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 200,
              },
            }}
          >
            <MenuItem onClick={handleMenuClose}>
              <Person sx={{ mr: 1 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default CustomAppBar; 