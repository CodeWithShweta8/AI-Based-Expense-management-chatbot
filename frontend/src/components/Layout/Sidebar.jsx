import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  useTheme,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Dashboard,
  Person,
  Receipt,
  Group,
  Assessment,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const Sidebar = ({ open, onClose, variant = 'permanent' }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/dashboard',
      roles: ['user', 'admin'],
    },
    {
      text: 'My Expenses',
      icon: <Receipt />,
      path: '/my-expenses',
      roles: ['user', 'admin'],
    },
    {
      text: 'Profile',
      icon: <Person />,
      path: '/profile',
      roles: ['user', 'admin'],
    },
    {
      text: 'User Management',
      icon: <Group />,
      path: '/users',
      roles: ['admin'],
    },
    {
      text: 'All Expenses',
      icon: <Assessment />,
      path: '/all-expenses',
      roles: ['admin'],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  const handleItemClick = (path) => {
    // Close the drawer on mobile
    if (variant === 'temporary') {
      onClose();
    }
    navigate(path);
  };

  const drawerContent = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          ExpenseManager
        </Typography>
      </Toolbar>
      <Divider />
      
      {/* User Info */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar 
          sx={{ 
            bgcolor: theme.palette.primary.main, 
            width: 40, 
            height: 40 
          }}
          src={user?.profile_picture ? `http://localhost:5000${user.profile_picture}` : undefined}
        >
          {!user?.profile_picture && (user?.name?.charAt(0)?.toUpperCase())}
        </Avatar>
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {user?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.role}
          </Typography>
        </Box>
      </Box>
      
      <Divider />
      
      <List>
        {filteredMenuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton 
                onClick={() => handleItemClick(item.path)}
                selected={isSelected}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.main + '20',
                    '&:hover': {
                      backgroundColor: theme.palette.primary.main + '30',
                    },
                  },
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    color: isSelected ? theme.palette.primary.main : 'inherit',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  sx={{
                    '& .MuiListItemText-primary': {
                      color: isSelected ? theme.palette.primary.main : 'inherit',
                      fontWeight: isSelected ? 600 : 400,
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </div>
  );

  if (variant === 'temporary') {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        '& .MuiDrawer-paper': {
          boxSizing: 'border-box',
          width: drawerWidth,
          backgroundColor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
      open
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar; 