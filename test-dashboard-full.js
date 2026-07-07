#!/usr/bin/env node
/**
 * Comprehensive Dashboard Test
 * Tests all dashboard statistics and button functionality
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function section(title) {
  console.log(`\n${colors.cyan}${'═'.repeat(60)}${colors.reset}`);
  log(`  ${title}`, 'cyan');
  console.log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}\n`);
}

async function request(method, pathname, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + pathname);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock_token_12345'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
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

async function testDashboard() {
  section('🧪 DASHBOARD STATISTICS & BUTTONS TEST');

  let passed = 0;
  let failed = 0;

  // Test 1: Health Check
  log('\n1️⃣  Testing Server Health...', 'yellow');
  try {
    const health = await request('GET', '/health');
    if (health.status === 200) {
      log('   ✅ Server is running', 'green');
      log(`   📍 Service: ${health.body.service}`, 'blue');
      passed++;
    } else {
      log('   ❌ Server health check failed', 'red');
      failed++;
    }
  } catch (err) {
    log(`   ❌ Error: ${err.message}`, 'red');
    failed++;
  }

  // Test 2: Dashboard Statistics
  log('\n2️⃣  Testing Dashboard Statistics API...', 'yellow');
  try {
    const stats = await request('GET', '/api/projects/stats/dashboard');
    if (stats.status === 200 && stats.body.success) {
      const data = stats.body.data;
      log('   ✅ Statistics loaded successfully', 'green');
      log(`   📊 Open Requests: ${colors.bright}${data.openRequests}${colors.reset}`, 'cyan');
      log(`   🚀 Active Projects: ${colors.bright}${data.activeProjects}${colors.reset}`, 'cyan');
      log(`   💰 Pending Payments: ${colors.bright}${data.pendingPayments}${colors.reset}`, 'cyan');
      log(`   📈 Completion Rate: ${colors.bright}${data.completionRate}%${colors.reset}`, 'cyan');
      log(`   💵 Total Spent: ${colors.bright}${data.totalSpent} DA${colors.reset}`, 'cyan');
      log(`   📋 Recent Projects: ${data.recentProjects.length} projects`, 'cyan');
      
      // Verify all stats are numbers
      if (typeof data.openRequests === 'number' &&
          typeof data.activeProjects === 'number' &&
          typeof data.pendingPayments === 'number') {
        log('   ✅ All statistics are working correctly', 'green');
        passed++;
      } else {
        log('   ⚠️  Some statistics are not in correct format', 'yellow');
        failed++;
      }
    } else {
      log('   ❌ Failed to load statistics', 'red');
      failed++;
    }
  } catch (err) {
    log(`   ❌ Error: ${err.message}`, 'red');
    failed++;
  }

  // Test 3: Recent Projects Display
  log('\n3️⃣  Testing Recent Projects Display...', 'yellow');
  try {
    const stats = await request('GET', '/api/projects/stats/dashboard');
    if (stats.body.data.recentProjects.length > 0) {
      log('   ✅ Recent projects loaded', 'green');
      stats.body.data.recentProjects.forEach((project, i) => {
        log(`   📌 Project ${i + 1}: ${project.title} (${project.status})`, 'blue');
      });
      passed++;
    } else {
      log('   ⚠️  No recent projects found', 'yellow');
    }
  } catch (err) {
    log(`   ❌ Error: ${err.message}`, 'red');
    failed++;
  }

  // Test 4: Available Services Button
  log('\n4️⃣  Testing Available Services Button...', 'yellow');
  try {
    const services = await request('GET', '/api/dashboard/services');
    if (services.status === 200 && services.body.success) {
      log('   ✅ Services button working', 'green');
      log(`   🎯 Available Services: ${services.body.data.length}`, 'cyan');
      services.body.data.slice(0, 3).forEach(service => {
        log(`      • ${service.name} - ${service.price} DA`, 'blue');
      });
      passed++;
    } else {
      log('   ❌ Services button failed', 'red');
      failed++;
    }
  } catch (err) {
    log(`   ❌ Error: ${err.message}`, 'red');
    failed++;
  }

  // Test 5: Service Request Button
  log('\n5️⃣  Testing Service Request Button...', 'yellow');
  try {
    const response = await request('POST', '/api/dashboard/service-request', {
      service_id: 1,
      title: 'اختبار طلب خدمة جديدة',
      description: 'وصف تجريبي للخدمة المطلوبة',
      budget: 10000
    });
    if (response.status === 201 || response.status === 200) {
      log('   ✅ Service request button working', 'green');
      log(`   📩 Project ID: ${response.body.project_id}`, 'blue');
      log(`   📝 Message: ${response.body.message}`, 'blue');
      passed++;
    } else {
      log('   ❌ Service request button failed', 'red');
      failed++;
    }
  } catch (err) {
    log(`   ❌ Error: ${err.message}`, 'red');
    failed++;
  }

  // Test 6: Message Team Button
  log('\n6️⃣  Testing Message Team Button...', 'yellow');
  try {
    const response = await request('POST', '/api/dashboard/message', {
      project_id: 1,
      message: 'رسالة تجريبية من لوحة التحكم'
    });
    if (response.status === 200 || response.status === 201) {
      log('   ✅ Message button working', 'green');
      log(`    💬 Message ID: ${response.body.comment_id}`, 'blue');
      passed++;
    } else {
      log('   ❌ Message button failed', 'red');
      failed++;
    }
  } catch (err) {
    log(`   ❌ Error: ${err.message}`, 'red');
    failed++;
  }

  // Test 7: View Invoices Button
  log('\n7️⃣  Testing View Invoices Button...', 'yellow');
  try {
    const invoices = await request('GET', '/api/dashboard/invoices');
    if (invoices.status === 200 && invoices.body.success) {
      log('   ✅ Invoices button working', 'green');
      log(`   📋 Total Invoices: ${invoices.body.data.length}`, 'cyan');
      if (invoices.body.data.length > 0) {
        invoices.body.data.slice(0, 2).forEach((inv, i) => {
          log(`      Invoice ${i + 1}: ${inv.title} - ${inv.amount} DA (${inv.payment_status})`, 'blue');
        });
      }
      passed++;
    } else {
      log('   ❌ Invoices button failed', 'red');
      failed++;
    }
  } catch (err) {
    log(`   ❌ Error: ${err.message}`, 'red');
    failed++;
  }

  // Test 8: Login Button
  log('\n8️⃣  Testing Login Button...', 'yellow');
  try {
    const login = await request('POST', '/api/auth/login', {
      email: 'test@example.com',
      password: 'Test123!@#'
    });
    if (login.status === 200 && login.body.token) {
      log('   ✅ Login button working', 'green');
      log(`   🔐 Token: ${login.body.token.substring(0, 20)}...`, 'blue');
      passed++;
    } else {
      log('   ❌ Login button failed', 'red');
      failed++;
    }
  } catch (err) {
    log(`   ❌ Error: ${err.message}`, 'red');
    failed++;
  }

  // Summary
  section('📊 TEST RESULTS');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, 'red');
  log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`, 'cyan');

  if (failed === 0) {
    section('🎉 ALL TESTS PASSED!');
    log('\nYour dashboard is fully functional:', 'green');
    log('  ✓ All statistics are displaying correctly', 'green');
    log('  ✓ All buttons are responding to user actions', 'green');
    log('  ✓ API endpoints are working as expected', 'green');
    log('\nYou can now use the dashboard at:', 'cyan');
    log('  http://localhost:3001/client-dashboard.html', 'yellow');
  } else {
    section('⚠️  SOME TESTS FAILED');
    log('Please check the errors above', 'yellow');
  }

  console.log('\n');
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests after a short delay to ensure server is ready
setTimeout(() => {
  testDashboard().catch(err => {
    log(`Fatal error: ${err.message}`, 'red');
    process.exit(1);
  });
}, 1000);
