#!/usr/bin/env node

/**
 * MEDS Digital Services - API Test Script
 * اختبر API بدون الحاجة لـ Postman
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:3000';
const API_ENDPOINT = '/api/auth/register';

// Test data
const testUser = {
    first_name: 'محمد',
    last_name: 'أحمد',
    username: 'mohamad_test_' + Date.now(),
    email: 'test_' + Date.now() + '@example.com',
    phone: '1234567890',
    password: 'Password@123',
    confirm_password: 'Password@123',
};

console.log(`
╔════════════════════════════════════════════════════════════╗
║  🧪 MEDS API Test - Testing Registration Endpoint         ║
╚════════════════════════════════════════════════════════════╝
`);

console.log('\n📝 Test User Data:');
console.log(JSON.stringify(testUser, null, 2));

const options = {
    hostname: 'localhost',
    port: 3000,
    path: API_ENDPOINT,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
    },
};

console.log('\n📤 Sending Request to:', `${BASE_URL}${API_ENDPOINT}`);
console.log('📋 Method:', options.method);
console.log('📋 Origin:', options.headers.Origin);

const req = http.request(options, (res) => {
    let data = '';

    console.log(`\n✅ Response Status: ${res.statusCode}`);
    console.log('📋 Response Headers:', JSON.stringify(res.headers, null, 2));

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('\n📥 Response Body:');
        try {
            const response = JSON.parse(data);
            console.log(JSON.stringify(response, null, 2));

            if (res.statusCode === 201) {
                console.log(`\n${colors.green}✓ Registration test PASSED!${colors.reset}`);
                console.log('✓ User created successfully');
                console.log('✓ Token received');
            } else if (res.statusCode === 400) {
                console.log(`\n${colors.yellow}⚠ Validation Error${colors.reset}`);
                console.log('Check your input data');
            } else if (res.statusCode === 500) {
                console.log(`\n${colors.red}✗ Server Error${colors.reset}`);
                console.log('Check that MySQL is running and database exists');
            }
        } catch (err) {
            console.log(data);
            console.log(`\n${colors.red}✗ Error parsing response${colors.reset}`);
        }
    });
});

req.on('error', (err) => {
    console.log(`\n${colors.red}✗ Connection Error: ${err.message}${colors.reset}`);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure server is running: npm run dev');
    console.log('   2. Check that port 3000 is available');
    console.log('   3. Check firewall settings');
});

// Color codes
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
};

console.log('\n⏳ Waiting for response...\n');

req.write(JSON.stringify(testUser));
req.end();

// Timeout after 10 seconds
setTimeout(() => {
    console.log(`${colors.red}✗ Request timed out${colors.reset}`);
    process.exit(1);
}, 10000);
