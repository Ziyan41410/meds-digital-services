const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Routes
const authRoutes = require('./routes/authRoutes');
const servicesRoutes = require('./routes/servicesRoutes');
const projectsRoutes = require('./routes/projectsRoutes');
const reviewsRoutes = require('./routes/reviewsRoutes');
const dashboardActionsRoutes = require('./routes/dashboardActionsRoutes');
const chatRoutes = require('./routes/chatRoutes');
const managerRoutes = require('./routes/managerRoutes');
const clientDashboardRoutes = require('./routes/clientDashboardRoutes');

// Middleware
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();

// Allowed Origins
// Production: Allow Render domains + local development
const allowedOrigins = [
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
    allowedOrigins.push(...customOrigins);
}

// Remove duplicates
const uniqueOrigins = [...new Set(allowedOrigins)];
console.log('✅ Allowed CORS origins:', uniqueOrigins);

app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);

app.use(compression());

app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 200,
    })
);

// CORS Configuration
app.use(
    cors({
        origin: function (origin, callback) {
            console.log('🌍 Request Origin:', origin);

            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) {
                return callback(null, true);
            }

            // Check if origin is in allowed list
            if (uniqueOrigins.includes(origin)) {
                return callback(null, true);
            }

            // For production, log warning but allow for polling transport
            console.warn(`⚠️ CORS origin not in whitelist: ${origin}`);
            // Allow all origins for Socket.io polling fallback
            return callback(null, true);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['Content-Length', 'X-Total-Count']
    })
);

app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Static Files
app.use(
    express.static(path.join(__dirname, '../frontend'), {
        setHeaders: (res, filePath) => {
            if (filePath.endsWith('.js')) {
                res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            } else if (filePath.endsWith('.css')) {
                res.setHeader('Content-Type', 'text/css; charset=utf-8');
            } else if (filePath.endsWith('.html')) {
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
            } else if (filePath.endsWith('.json')) {
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
            }
        }
    })
);

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'MEDS Digital Services API',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/dashboard', dashboardActionsRoutes);
app.use('/api/client/dashboard', clientDashboardRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/manager', managerRoutes);

// Frontend Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/register.html'));
});

app.get('/chats', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/chats.html'));
});

app.get('/client-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/client-dashboard.html'));
});

// Catch All
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
