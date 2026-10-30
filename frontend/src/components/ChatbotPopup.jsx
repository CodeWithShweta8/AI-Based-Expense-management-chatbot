import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  IconButton, 
  Typography, 
  Paper, 
  Fade, 
  Badge,
  Tooltip,
  CircularProgress,
  Chip
} from '@mui/material';
import { 
  Send as SendIcon, 
  Close as CloseIcon, 
  Chat as ChatIcon,
  SmartToy as BotIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useChatSocket } from '../hooks/useChatSocket';

const ChatbotPopup = () => {
  const {
    messages,
    sendMessage,
    isConnected,
    unreadCount,
    markAsRead,
    isLoading
  } = useChatSocket();

  const { user, loading: authLoading } = useAuth(); // Destructure loading as authLoading to avoid conflict
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',    // Ensure the end of the element is in view
        inline: 'nearest' // Ensure the element is visible horizontally
      });
    }
  }, [messages]);

  // Log user and authLoading states for debugging
  useEffect(() => {
    console.log('ChatbotPopup - user:', user);
    console.log('ChatbotPopup - authLoading:', authLoading);
  }, [user, authLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Mark messages as read when popup opens
  useEffect(() => {
    if (isOpen) {
      markAsRead();
    }
  }, [isOpen, markAsRead]);

  const handleSendMessage = () => {
    if (!message.trim() || isLoading) return;

    sendMessage(message);
    setMessage('');
    setIsTyping(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    setIsTyping(true);
    
    // Clear typing indicator after 1 second of no typing
    clearTimeout(window.typingTimer);
    window.typingTimer = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: { xs: 16, sm: 24, md: 32 }, // Responsive right offset
          zIndex: 1300,
        }}
      >
        <Tooltip title={isOpen ? 'Close Chat' : 'Open Chat Assistant'}>
          <IconButton
            onClick={toggleChat}
            sx={{
              width: 60,
              height: 60,
              backgroundColor: 'primary.main',
              color: 'white',
              boxShadow: 3,
              '&:hover': {
                backgroundColor: 'primary.dark',
                boxShadow: 6,
              },
              transition: 'all 0.3s ease',
            }}
          >
            <Badge badgeContent={unreadCount} color="error">
              {isOpen ? <CloseIcon /> : <ChatIcon />}
            </Badge>
          </IconButton>
        </Tooltip>
      </Box>

      {/* Chat Popup */}
      <Fade in={isOpen}>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: { xs: 80, sm: 100 },
            right: { xs: 8, sm: 24, md: 32 }, // Responsive right offset
            width: { xs: '95vw', sm: 380 },
            maxWidth: 420,
            height: { xs: '70vh', sm: 500 },
            zIndex: 1300,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: 'background.paper',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              backgroundColor: 'primary.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BotIcon />
              <Typography variant="h6">
                AI Assistant
              </Typography>
              <Chip
                label={isConnected ? 'Online' : 'Offline'}
                size="small"
                sx={{
                  backgroundColor: isConnected ? 'success.main' : 'error.main',
                  color: 'white',
                  fontSize: '0.7rem',
                }}
              />
            </Box>
            <IconButton
              onClick={toggleChat}
              sx={{ color: 'white' }}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Messages Area */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {(messages || []).length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center',
                  color: 'text.secondary',
                }}
              >
                <BotIcon sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Hello {authLoading ? 'Loading...' : user?.name || 'there'}! 💼 I'm your expense management assistant. How can I help?
                </Typography>
                <Typography variant="body2">
                  I'm your AI assistant. How can I help you with your expenses today?
                </Typography>
              </Box>
            ) : (
              (messages || []).map((msg, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '75%',
                      display: 'flex',
                      flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                      alignItems: 'flex-end',
                      gap: 1,
                    }}
                  >
                    {/* Avatar */}
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: msg.role === 'user' ? 'primary.main' : 'grey.300',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: msg.role === 'user' ? 'white' : 'text.primary',
                      }}
                    >
                      {msg.role === 'user' ? <PersonIcon fontSize="small" /> : <BotIcon fontSize="small" />}
                    </Box>

                    {/* Message Bubble */}
                    <Box
                      sx={{
                        backgroundColor: msg.role === 'user' ? 'primary.main' : 'grey.100',
                        color: msg.role === 'user' ? 'white' : 'text.primary',
                        p: 1.5,
                        borderRadius: 2,
                        borderTopLeftRadius: msg.role === 'user' ? 2 : 0.5,
                        borderTopRightRadius: msg.role === 'user' ? 0.5 : 2,
                        position: 'relative',
                      }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {msg.content && msg.content.trim() ? msg.content : '[No content received]'}
                      </Typography>
                      {msg.timestamp && (
                        <Typography
                          variant="caption"
                          sx={{
                            opacity: 0.7,
                            fontSize: '0.7rem',
                            mt: 0.5,
                            display: 'block',
                          }}
                        >
                          {formatTime(msg.timestamp)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              ))
            )}
            
            {/* Loading indicator */}
            {isLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: 'grey.300',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BotIcon fontSize="small" />
                </Box>
                <Box
                  sx={{
                    backgroundColor: 'grey.100',
                    p: 1.5,
                    borderRadius: 2,
                    borderTopLeftRadius: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    AI is thinking...
                  </Typography>
                </Box>
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box
            sx={{
              p: 2,
              borderTop: 1,
              borderColor: 'divider',
              backgroundColor: 'background.paper',
            }}
          >
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                ref={inputRef}
                fullWidth
                variant="outlined"
                placeholder="Type your message..."
                value={message}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                multiline
                maxRows={3}
                disabled={!isConnected || isLoading}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
              <IconButton
                onClick={handleSendMessage}
                disabled={!message.trim() || !isConnected || isLoading}
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '&:disabled': {
                    backgroundColor: 'grey.300',
                  },
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Fade>
    </>
  );
};

export default ChatbotPopup; 