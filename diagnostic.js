#!/usr/bin/env node

const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

console.log('\n📋 === MEDS Digital Services - Diagnostic Report ===\n');

// 1. Check Environment Variables
console.log('✅ 1️⃣ Environment Variables:');
console.log(`   • NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   • SERVER_PORT: ${process.env.SERVER_PORT}`);
console.log(`   • DB_HOST: ${process.env.DB_HOST}`);
console.log(`   • JWT_SECRET: ${process.env.JWT_SECRET ? '✓ SET' : '✗ MISSING'}`);
console.log(`   • CLIENT_URL: ${process.env.CLIENT_URL}`);
console.log(`   • ALLOWED ORIGINS: ${(process.env.CLIENT_URL || 'http://localhost:3001,http://localhost:5500,http://127.0.0.1:3001,http://127.0.0.1:5500').split(',').map(o => o.trim()).join(', ')}`);

// 2. Check Database Connection
console.log('\n✅ 2️⃣ Testing Database Connection...');
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
});

pool.getConnection()
    .then(conn => {
        console.log('   ✓ Database connection successful!');
        conn.release();
        return conn.execute('SHOW TABLES');
    })
    .catch(err => {
        console.error(`   ✗ Database connection failed: ${err.message}`);
        console.error('   📝 Make sure:');
        console.error('      - MySQL server is running');
        console.error('      - Database "meds_digital_services" exists');
        console.error('      - Run: mysql -u root < database/meds_schema.sql');
    });

// 3. Check File Structure
console.log('\n✅ 3️⃣ File Structure:');
const fs = require('fs');
const files = [
    'backend/app.js',
    'backend/server.js',
    'backend/controllers/authController.js',
    'backend/models/User.js',
    'database/meds_schema.sql',
    'frontend/index.html',
    'frontend/assets/js/main.js',
];

files.forEach(file => {
    const fullPath = path.join(__dirname, file);
    const exists = fs.existsSync(fullPath);
    console.log(`   ${exists ? '✓' : '✗'} ${file}`);
});

// 4. Check Server Port
console.log('\n✅ 4️⃣ Server Port Status:');
const port = process.env.SERVER_PORT || 3000;
const server = http.createServer();

server.listen(port, () => {
    console.log(`   ✓ Port ${port} is available`);
    server.close();
    printSummary();
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`   ✗ Port ${port} is already in use`);
        console.log(`   💡 Solution: Kill process or use different port`);
    } else {
        console.log(`   ✗ Error: ${err.message}`);
    }
    printSummary();
});

function printSummary() {
    console.log('\n🎯 === QUICK START ===\n');
    console.log('1. Ensure MySQL is running');
    console.log('2. Run database schema: mysql -u root < database/meds_schema.sql');
    console.log('3. Install dependencies: npm install');
    console.log('4. Start server: npm run dev');
    console.log('5. Open: http://localhost:3000\n');
}
