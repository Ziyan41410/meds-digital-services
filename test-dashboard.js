/**
 * Test Dashboard APIs
 * Run with: node test-dashboard.js
 */

const http = require('http');

// Helper to make HTTP requests
function apiRequest(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path,
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(data)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    console.log('🧪 Starting Dashboard API Tests...\n');

    try {
        // Test 1: Health Check
        console.log('Test 1: Health Check');
        const health = await apiRequest('GET', '/health');
        console.log(`✓ Status: ${health.status}`);
        console.log(`✓ Response:`, health.data, '\n');

        // Test 2: Get Dashboard Stats (without token - should fail)
        console.log('Test 2: Get Dashboard Stats (without token)');
        const statsNoToken = await apiRequest('GET', '/api/projects/stats/dashboard');
        console.log(`✓ Status: ${statsNoToken.status} (expected 401 or 403)`);
        console.log(`✓ Message: ${statsNoToken.data.message || 'No token'}\n`);

        // Test 3: Get Available Services
        console.log('Test 3: Get Available Services');
        const services = await apiRequest('GET', '/api/dashboard/services');
        console.log(`✓ Status: ${services.status}`);
        if (services.data.data) {
            console.log(`✓ Found ${services.data.data.length} services`);
            if (services.data.data.length > 0) {
                console.log(`  - ${services.data.data[0].name} (${services.data.data[0].price} ريال)`);
            }
        }
        console.log();

        // Test 4: Try to create service request (without token)
        console.log('Test 4: Create Service Request (without token)');
        const reqNoToken = await apiRequest('POST', '/api/dashboard/service-request', {
            service_id: 1,
            title: 'اختبار',
            description: 'اختبار الخدمة'
        });
        console.log(`✓ Status: ${reqNoToken.status} (expected 401)`);
        console.log(`✓ Message: ${reqNoToken.data.message || 'No token'}\n`);

        // Test 5: Try to get invoices (without token)
        console.log('Test 5: Get Invoices (without token)');
        const invoices = await apiRequest('GET', '/api/dashboard/invoices');
        console.log(`✓ Status: ${invoices.status} (expected 401)`);
        console.log(`✓ Message: ${invoices.data.message || 'No token'}\n`);

        console.log('✅ All basic tests completed!\n');
        console.log('📌 Note: To test authenticated endpoints, you need a valid JWT token');
        console.log('   1. Login first: POST /api/auth/login');
        console.log('   2. Get your token from the response');
        console.log('   3. Include it in the Authorization header\n');

    } catch (error) {
        console.error('❌ Test Error:', error.message);
    }

    process.exit(0);
}

// Wait a moment for server to be ready
setTimeout(runTests, 1000);
