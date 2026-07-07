require('dotenv').config();
const app = require('./app');
const http = require('http');
const socketIO = require('socket.io');
const runMigrations = require('./utils/migrationRunner');
const { initializeSocket } = require('./sockets/chatSocket');
const { setupSocket } = require('./sockets/socketIoHandlers .js');

const PORT = process.env.SERVER_PORT || process.env.PORT || 3000;
const HOST = process.env.SERVER_HOST || 'localhost';

const server = http.createServer(app);

// Initialize Socket.io
const io = socketIO(server, {
  cors: {
    origin: (process.env.CLIENT_URL || 'http://localhost:3000,http://localhost:3001,http://localhost:5500,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:5500')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  },
  maxHttpBufferSize: 10 * 1024 * 1024,
  transports: ['websocket', 'polling']
});

// Initialize chat socket handlers
initializeSocket(io);
setupSocket(io);

// Attach io to app for use in routes
app.io = io;

// Run migrations before starting server
(async () => {
    try {
        console.log('🔄 Running database migrations...');
        await runMigrations();
        
        server.listen(PORT, HOST, () => {
            console.log(`🚀 Server running on http://${HOST}:${PORT}`);
            console.log(`✅ Socket.io initialized`);
            console.log(`✅ Environment: ${process.env.NODE_ENV}`);
            console.log(`✅ Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
})();
