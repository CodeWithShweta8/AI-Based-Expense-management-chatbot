import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

export const useChatSocket = () => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;
  const reconnectAttemptsRef = useRef(0);

  // Initialize socket connection
  useEffect(() => {
    if (!token || !user) return;

    const newSocket = io(process.env.NODE_ENV === 'production'
      ? 'wss://your-backend-domain.com'
      : 'ws://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
      setIsLoading(false);
      reconnectAttemptsRef.current = 0;
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from chat server:', reason);
      setIsConnected(false);
      setIsLoading(false);

      // Only attempt manual reconnection if it's not due to server shutdown
      if (reason !== 'io server disconnect') {
        handleReconnect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
      setIsLoading(false);
      handleReconnect();
    });

    // Chat event handlers
    newSocket.on('chat_message_received', (message) => {
      setMessages(prev => [...prev, message]);
      setIsLoading(false);
    });

    newSocket.on('chat_reply', (message) => {
      console.log('Received chat_reply:', message);
      if (!message || !message.content || !message.content.trim()) {
        console.warn('Received chat_reply with empty or missing content:', message);
      }
      setMessages(prev => {
        const updated = [...prev, message];
        const limited = updated.slice(-50); // Keep only the last 50 messages
        console.log('Updated messages array:', limited);
        return limited;
      });
      setIsLoading(false);

      // Increment unread count if chat is not visible
      if (!isVisible) {
        setUnreadCount(prev => prev + 1);
      }
    });

    newSocket.on('chat_error', (error) => {
      console.error('Chat error:', error);
      setIsLoading(false);

      // Add error message to chat
      const errorMessage = {
        role: 'assistant',
        content: error.error || 'An error occurred while processing your message.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    });

    // Typing indicators (optional - can be extended)
    newSocket.on('user_typing', (data) => {
      // Handle typing indicators from other users if needed
      console.log('User typing:', data);
    });

    newSocket.on('user_stopped_typing', (data) => {
      // Handle stop typing indicators
      console.log('User stopped typing:', data);
    });

    setSocket(newSocket);

    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      newSocket.close();
    };
  }, [token, user, isVisible]);

  // Handle reconnection logic
  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    reconnectAttemptsRef.current += 1;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);

    clearTimeout(reconnectTimeoutRef.current);
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Reconnection attempt ${reconnectAttemptsRef.current}`);
      socket?.connect();
    }, delay);
  }, [socket]);

  // Page visibility handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Send message function
  const sendMessage = useCallback((message) => {
    if (!socket || !isConnected || !message.trim()) return;

    setIsLoading(true);

    const messageData = {
      message: message.trim(),
      messages: messages // Send conversation history for context
    };

    socket.emit('chat_message', messageData);
  }, [socket, isConnected, messages]);

  // Mark messages as read
  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Clear chat history
  const clearMessages = useCallback(() => {
    setMessages([]);
    setUnreadCount(0);
  }, []);

  // Get connection status
  const getConnectionStatus = useCallback(() => {
    if (!socket) return 'disconnected';
    if (isConnected) return 'connected';
    if (socket.connected === false) return 'disconnected';
    return 'connecting';
  }, [socket, isConnected]);

  return {
    messages,
    sendMessage,
    isConnected,
    isLoading,
    unreadCount,
    markAsRead,
    clearMessages,
    connectionStatus: getConnectionStatus()
  };
}; 