require('dotenv').config();
const app = require('./app');
const http = require('http');
const socketIO = require('socket.io');
const runMigrations = require('./utils/migrationRunner');
const { initializeSocket } = require('./sockets/chatSocket');
const { setupSocket } = require('./sockets/socketIoHandlers .js');

const PORT = process.env.SERVER_PORT || process.env.PORT || 3001;
const HOST = process.env.SERVER_HOST || '0.0.0.0';

const server = http.createServer(app);

// Socket.io Allowed Origins
const allowedSocketOrigins = [
    'https://meds-digital-services.onrender.com',
    'https://meds-digital-services-api.onrender.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5500',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5500'
];

// Support environment variable override
if (process.env.CLIENT_URL) {
    const customOrigins = process.env.CLIENT_URL.split(',').map(o => o.trim()).filter(Boolean);
    allowedSocketOrigins.push(...customOrigins);
}

// Remove duplicates
const uniqueSocketOrigins = [...new Set(allowedSocketOrigins)];
console.log('✅ Allowed Socket.io origins:', uniqueSocketOrigins);

// Initialize Socket.io with proper CORS
const io = socketIO(server, {
    cors: {
        origin: function (origin, callback) {
            console.log('🔌 Socket.io Request Origin:', origin);

            // Allow requests with no origin
            if (!origin) {
                return callback(null, true);
            }

            // Check if origin is in allowed list
            if (uniqueSocketOrigins.includes(origin)) {
                return callback(null, true);
            }

            // For production, allow polling from any origin
            console.warn(`⚠️ Socket.io origin not in whitelist: ${origin}, allowing for polling`);
            return callback(null, true);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['Content-Length']
    },
    maxHttpBufferSize: 10 * 1024 * 1024,
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 60000
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
            console.log(`✅ Socket.io initialized with CORS enabled`);
            console.log(`✅ Transports: websocket, polling`);
            console.log(`✅ Environment: ${process.env.NODE_ENV}`);
            console.log(`✅ Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
})();
