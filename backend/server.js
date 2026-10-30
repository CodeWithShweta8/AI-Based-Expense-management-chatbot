const app = require('./src/app');
const { initializeDatabase } = require('./src/services/initService');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Initialize database and create admin user
    await initializeDatabase();
    
    // Create HTTP server
    const server = http.createServer(app);
    
    // Initialize Socket.IO
    const io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://your-frontend-domain.com'] 
          : ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST']
      }
    });

    // Socket.IO authentication middleware
    io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Check for required user info
        if (!decoded.userId || !decoded.email || !decoded.name) {
          console.warn('Decoded token missing user info:', decoded);
          return next(new Error('Token missing user info (userId, email, or name)'));
        }
        socket.userId = decoded.userId;
        socket.userEmail = decoded.email;
        socket.userName = decoded.name;
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });

    // Socket.IO connection handling
    io.on('connection', (socket) => {
      console.log(`User ${socket.userName} (${socket.userEmail}) connected via WebSocket`);
      
      // Handle chat messages
      socket.on('chat_message', async (data) => {
        try {
          const { handleChatMessage } = require('./src/services/chatSocketService');
          await handleChatMessage(socket, data);
        } catch (error) {
          console.error('Chat message error:', error);
          socket.emit('chat_error', { error: 'Failed to process message' });
        }
      });

      // Handle typing indicators
      socket.on('typing_start', () => {
        socket.broadcast.emit('user_typing', {
          userId: socket.userId,
          userName: socket.userName
        });
      });

      socket.on('typing_stop', () => {
        socket.broadcast.emit('user_stopped_typing', {
          userId: socket.userId
        });
      });

      socket.on('disconnect', () => {
        console.log(`User ${socket.userName} disconnected`);
      });
    });
    
    // Start the server
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📚 API Documentation:`);
      console.log(`   Swagger UI: http://localhost:${PORT}/api-docs`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
      console.log(`   Auth: http://localhost:${PORT}/api/auth`);
      console.log(`   Users: http://localhost:${PORT}/api/users`);
      console.log(`   Expenses: http://localhost:${PORT}/api/expenses`);
      console.log(`🔌 WebSocket Chat: ws://localhost:${PORT}`);
      console.log(`\n🔐 Default Admin Credentials:`);
      console.log(`   Email: admin@test.com`);
      console.log(`   Password: admin`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 