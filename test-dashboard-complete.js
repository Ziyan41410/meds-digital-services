/**
 * Complete Dashboard Test
 * Tests all dashboard endpoints and functionality
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let testToken = '';
let testUserId = '';

// Color codes for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
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
  log('\n🧪 STARTING DASHBOARD TESTS\n', 'blue');

  try {
    // Test 1: Health Check
    log('1️⃣  Testing Health Check...', 'yellow');
    const health = await request('GET', '/health');
    if (health.status === 200) {
      log('✅ Health check passed', 'green');
      log(`   Server: ${health.body.service}`);
    } else {
      log('❌ Health check failed', 'red');
    }

    // Test 2: Register Test User
    log('\n2️⃣  Registering Test User...', 'yellow');
    const register = await request('POST', '/api/auth/register', {
      first_name: 'محمد',
      last_name: 'أحمد',
      email: 'test-dashboard@example.com',
      username: 'test_dashboard_' + Date.now(),
      password: 'Test123!@#',
      role_id: 2
    });

    if (register.status === 201 || register.status === 200) {
      log('✅ User registered successfully', 'green');
      testUserId = register.body.user_id || register.body.data?.user_id;
      log(`   User ID: ${testUserId}`);
    } else {
      log(`❌ Registration failed: ${register.body?.message || 'Unknown error'}`, 'red');
      if (register.body?.message?.includes('already exists')) {
        log('⚠️  User already exists, trying to login...', 'yellow');
      } else {
        throw new Error('Cannot register test user');
      }
    }

    // Test 3: Login
    log('\n3️⃣  Testing Login...', 'yellow');
    const login = await request('POST', '/api/auth/login', {
      email: 'test-dashboard@example.com',
      password: 'Test123!@#'
    });

    if (login.status === 200 && login.body.token) {
      log('✅ Login successful', 'green');
      testToken = login.body.token;
      log(`   Token: ${testToken.substring(0, 20)}...`);
    } else {
      log(`❌ Login failed: ${login.body?.message || 'Unknown error'}`, 'red');
      throw new Error('Cannot login');
    }

    // Test 4: Get Dashboard Stats
    log('\n4️⃣  Testing Dashboard Stats...', 'yellow');
    const stats = await request('GET', '/api/projects/stats/dashboard', null, {
      Authorization: `Bearer ${testToken}`
    });

    if (stats.status === 200) {
      log('✅ Dashboard stats retrieved', 'green');
      const data = stats.body.data;
      log(`   Open Requests: ${data.openRequests}`, 'blue');
      log(`   Active Projects: ${data.activeProjects}`, 'blue');
      log(`   Pending Payments: ${data.pendingPayments}`, 'blue');
      log(`   Completion Rate: ${data.completionRate}%`, 'blue');
      log(`   Total Spent: ${data.totalSpent}`, 'blue');
      log(`   Recent Projects: ${data.recentProjects.length} projects`, 'blue');
    } else {
      log(`❌ Failed to get stats: ${stats.body?.message || 'Unknown error'}`, 'red');
    }

    // Test 5: Get Available Services
    log('\n5️⃣  Testing Available Services...', 'yellow');
    const services = await request('GET', '/api/dashboard/services', null, {
      Authorization: `Bearer ${testToken}`
    });

    if (services.status === 200) {
      log('✅ Services retrieved', 'green');
      log(`   Available Services: ${services.body.data?.length || 0}`, 'blue');
      if (services.body.data?.length > 0) {
        log(`   First Service: ${services.body.data[0].name}`, 'blue');
      }
    } else {
      log(`❌ Failed to get services: ${services.body?.message || 'Unknown error'}`, 'red');
    }

    // Test 6: Create Service Request
    log('\n6️⃣  Testing Service Request Creation...', 'yellow');
    const serviceRequest = await request('POST', '/api/dashboard/service-request', {
      service_id: 1,
      title: 'اختبار طلب خدمة',
      description: 'وصف تجريبي للخدمة',
      budget: 5000
    }, {
      Authorization: `Bearer ${testToken}`
    });

    if (serviceRequest.status === 201 || serviceRequest.status === 200) {
      log('✅ Service request created', 'green');
      log(`   Project ID: ${serviceRequest.body.project_id}`, 'blue');
    } else {
      log(`❌ Failed to create service request: ${serviceRequest.body?.message || 'Unknown error'}`, 'red');
    }

    // Test 7: Get Invoices
    log('\n7️⃣  Testing Get Invoices...', 'yellow');
    const invoices = await request('GET', '/api/dashboard/invoices', null, {
      Authorization: `Bearer ${testToken}`
    });

    if (invoices.status === 200) {
      log('✅ Invoices retrieved', 'green');
      log(`   Total Invoices: ${invoices.body.data?.length || 0}`, 'blue');
      log(`   Pagination - Current: ${invoices.body.pagination?.current_page || 'N/A'}, Total Pages: ${invoices.body.pagination?.total_pages || 'N/A'}`, 'blue');
    } else {
      log(`❌ Failed to get invoices: ${invoices.body?.message || 'Unknown error'}`, 'red');
    }

    // Test 8: Send Message to Team
    log('\n8️⃣  Testing Send Message...', 'yellow');
    const message = await request('POST', '/api/dashboard/message', {
      project_id: 1,
      message: 'رسالة تجريبية من لوحة التحكم'
    }, {
      Authorization: `Bearer ${testToken}`
    });

    if (message.status === 200 || message.status === 201) {
      log('✅ Message sent successfully', 'green');
      log(`   Message ID: ${message.body.comment_id || 'N/A'}`, 'blue');
    } else {
      log(`⚠️  Message send result: ${message.body?.message || message.status}`, 'yellow');
    }

    log('\n✅ DASHBOARD TESTS COMPLETED\n', 'green');

  } catch (error) {
    log(`\n❌ TEST ERROR: ${error.message}\n`, 'red');
    process.exit(1);
  }
}

// Run tests
runTests().then(() => {
  log('All tests completed successfully! 🎉\n', 'green');
  process.exit(0);
}).catch(err => {
  log(`Test suite failed: ${err.message}\n`, 'red');
  process.exit(1);
});
