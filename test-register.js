const http = require('http');

const timestamp = Date.now();
const data = JSON.stringify({
    first_name: 'Ahmed',
    last_name: 'Mohamed',
    username: 'user_' + timestamp,
    email: 'user' + timestamp + '@test.com',
    phone: '050' + String(timestamp).slice(-7),
    password: 'Test@1234'
});

console.log('Sending:', data);

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log(`\n✅ Status: ${res.statusCode}`);
        try {
            const json = JSON.parse(body);
            console.log('Response:', JSON.stringify(json, null, 2));
        } catch (e) {
            console.log('Response:', body);
        }
        process.exit(0);
    });
});

req.on('error', (e) => {
    console.error(`❌ Error: ${e.message}`);
    process.exit(1);
});

req.write(data);
req.end();



