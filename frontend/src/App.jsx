import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import theme from './theme';
import Login from './components/Login';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import MyExpenses from './components/Expenses/MyExpenses';
import UserManagement from './components/Admin/UserManagement';
import AllExpenses from './components/Admin/AllExpenses';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // You can replace with a proper loading component
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <MainLayout>{children}</MainLayout>;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Default route - redirect to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Dashboard route */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Profile route */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            {/* My Expenses route */}
            <Route 
              path="/my-expenses" 
              element={
                <ProtectedRoute>
                  <MyExpenses />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/users" 
              element={
                <ProtectedRoute>
                  <UserManagement />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/all-expenses" 
              element={
                <ProtectedRoute>
                  <AllExpenses />
                </ProtectedRoute>
              } 
            />

            {/* Catch all route - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
