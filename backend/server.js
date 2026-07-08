require('dotenv').config();
const app = require('./app');
const http = require('http');
const socketIO = require('socket.io');
const runMigrations = require('./utils/migrationRunner');
const { initializeSocket } = require('./sockets/chatSocket');
const { setupSocket } = require('./sockets/socketIoHandlers .js');

const PORT = process.env.SERVER_PORT || process.env.PORT || 3000;

const server = http.createServer(app);

// Initialize Socket.io

const io = socketIO(server, {
  cors: {
    origin: [
      'http://localhost:3000',      // للتطوير المحلي
      'http://localhost:3001',
      'https://meds-digital-services.onrender.com'  // أضفنا Render URL
    ],
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

        server.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`✅ Socket.io initialized`);
            console.log(`✅ Environment: ${process.env.NODE_ENV}`);
            console.log(`✅ Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
})();
