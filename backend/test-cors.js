const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

const allowedOrigins = ['http://localhost:3001', 'http://localhost:5500', 'http://127.0.0.1:3001', 'http://127.0.0.1:5500'];

console.log('✅ Allowed CORS origins:', allowedOrigins);

const corsOptions = {
    origin(origin, callback) {
        console.log(`📍 Request origin: ${origin}`);
        if (!origin || allowedOrigins.includes(origin)) {
            console.log('✅ CORS approved');
            return callback(null, true);
        }
        console.warn(`⚠️ CORS blocked: ${origin}`);
        return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'MEDS Digital Services API' });
});

app.post('/api/auth/register', (req, res) => {
    console.log('📨 Register request received');
    res.json({ success: true, message: 'Register endpoint working' });
});

app.listen(PORT, () => {
    console.log(`🚀 Test server running on port ${PORT}`);
});
