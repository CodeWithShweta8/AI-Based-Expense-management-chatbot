import React, { useState } from 'react';
import {
  Box,
  Toolbar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CustomAppBar from './AppBar';
import Sidebar from './Sidebar';
import ChatbotPopup from '../ChatbotPopup';

const MainLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CustomAppBar onMenuClick={handleDrawerToggle} isMobile={isMobile} />
      
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar variant="permanent" />
      )}
      
      {/* Mobile Sidebar */}
      {isMobile && (
        <Sidebar
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
        />
      )}
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: '100vh',
          width: { md: `calc(100% - 240px)` },
          ml: { md: '240px' }, // Prevent overlap with sidebar
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
      
      {/* Chatbot Popup - appears on all pages */}
      <ChatbotPopup />
    </Box>
  );
};

export default MainLayout; 