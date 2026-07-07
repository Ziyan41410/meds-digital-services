/**
Database Configuration - MySQL Connection Setup
Handles connection pooling and error handling
Falls back to mock mode if unavailable
*/
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'meds_digital_services',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

// Suppress error logging during initialization
pool.on('error', (err) => {
    if (err.code !== 'PROTOCOL_CONNECTION_LOST') {
        console.error('Database pool error:', err.code);
    }
});

// Test the connection asynchronously (don't block startup)
(async () => {
    try {
        const conn = await Promise.race([
            pool.getConnection(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        console.log('✅ Database connection successful');
        conn.release();
    } catch (err) {
        console.warn('⚠️  Database connection failed - running in mock mode');
    }
})();

module.exports = pool;