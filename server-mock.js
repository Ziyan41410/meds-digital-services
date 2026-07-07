#!/usr/bin/env node
/**
 * Dashboard Quick Test - No Database Required
 * Tests all dashboard functionality with mock data
 */

const http = require('http');
const PORT = 3000;

// Mock database data
const mockData = {
  users: {
    1: { id: 1, username: 'test_user', email: 'test@example.com', first_name: 'محمد', last_name: 'أحمد', role_id: 2 }
  },
  services: [
    { id: 1, name: 'تطوير مواقع ويب', description: 'تطوير مواقع ويب احترافية', price: 50000 },
    { id: 2, name: 'تسويق رقمي', description: 'خدمات التسويق الرقمي', price: 25000 },
    { id: 3, name: 'أمن سيبراني', description: 'خدمات الأمن السيبراني', price: 40000 }
  ],
  projects: [
    { id: 1, title: 'موقع تعريفي', description: 'موقع تعريفي للشركة', status: 'in_progress', client_id: 1, service_id: 1, budget: 30000, progress: 50, paid: 0 },
    { id: 2, title: 'حملة تسويقية', description: 'حملة تسويقية شهرية', status: 'in_progress', client_id: 1, service_id: 2, budget: 15000, progress: 30, paid: 0 },
    { id: 3, title: 'فحص أمني', description: 'فحص أمني أساسي', status: 'pending', client_id: 1, service_id: 3, budget: 25000, progress: 0, paid: 0 }
  ]
};

// Mock token
const mockToken = 'mock_token_12345';
let loggedInUserId = 1;

// Simple server
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const path = req.url.split('?')[0];
  const method = req.method;

  console.log(`${method} ${path}`);

  // Health check
  if (path === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'OK',
      service: 'MEDS Digital Services API (Mock)',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Dashboard Stats
  if (path === '/api/projects/stats/dashboard') {
    const clientProjects = mockData.projects.filter(p => p.client_id === loggedInUserId);
    const openProjects = clientProjects.filter(p => ['pending', 'on_hold'].includes(p.status)).length;
    const activeProjects = clientProjects.filter(p => p.status === 'in_progress').length;
    const pendingPayments = clientProjects.filter(p => p.status === 'completed' && p.paid === 0).length;

    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: {
        openRequests: openProjects,
        activeProjects: activeProjects,
        pendingPayments: pendingPayments,
        completionRate: 75,
        totalSpent: clientProjects.reduce((sum, p) => sum + (p.budget || 0), 0),
        recentProjects: clientProjects.slice(0, 4).map(p => ({
          id: p.id,
          title: p.title,
          description: p.description,
          status: p.status,
          progress: p.progress,
          service_name: mockData.services.find(s => s.id === p.service_id)?.name || 'Unknown'
        }))
      }
    }));
    return;
  }

  // Available Services
  if (path === '/api/dashboard/services') {
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: mockData.services
    }));
    return;
  }

  // Get Invoices
  if (path === '/api/dashboard/invoices') {
    const clientProjects = mockData.projects.filter(p => p.client_id === loggedInUserId);
    const invoices = clientProjects.map(p => ({
      id: p.id,
      title: p.title,
      amount: p.budget,
      status: p.status,
      payment_status: p.paid ? 'مدفوع' : (p.status === 'completed' ? 'معلق' : 'قيد المراجعة'),
      invoice_date: new Date().toISOString(),
      service_name: mockData.services.find(s => s.id === p.service_id)?.name || 'Unknown'
    }));

    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: invoices,
      pagination: {
        current_page: 1,
        total_pages: 1,
        total_items: invoices.length
      }
    }));
    return;
  }

  // Service Request
  if (path === '/api/dashboard/service-request' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      const newProject = {
        id: mockData.projects.length + 1,
        title: data.title,
        description: data.description,
        status: 'pending',
        client_id: loggedInUserId,
        service_id: data.service_id,
        budget: data.budget,
        progress: 0,
        paid: 0
      };
      mockData.projects.push(newProject);

      res.writeHead(201);
      res.end(JSON.stringify({
        success: true,
        message: 'تم إنشاء الطلب بنجاح',
        project_id: newProject.id
      }));
    });
    return;
  }

  // Send Message
  if (path === '/api/dashboard/message' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        message: 'تم إرسال الرسالة بنجاح',
        comment_id: Math.floor(Math.random() * 10000)
      }));
    });
    return;
  }

  // Login
  if (path === '/api/auth/login' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        token: mockToken,
        user_id: loggedInUserId,
        user: mockData.users[loggedInUserId]
      }));
    });
    return;
  }

  // Not Found
  res.writeHead(404);
  res.end(JSON.stringify({
    success: false,
    message: 'Not Found'
  }));
});

server.listen(PORT, () => {
  console.log(`\n${'═'.repeat(60)}`);
  console.log('🚀 MOCK SERVER RUNNING');
  console.log(`${'═'.repeat(60)}`);
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🔌 API Base: http://localhost:${PORT}/api`);
  console.log(`🧪 Test Dashboard: http://localhost:3001/client-dashboard.html`);
  console.log(`${'═'.repeat(60)}\n`);
  console.log('✅ All dashboard endpoints are available:');
  console.log('   ✓ GET  /health');
  console.log('   ✓ GET  /api/projects/stats/dashboard');
  console.log('   ✓ GET  /api/dashboard/services');
  console.log('   ✓ GET  /api/dashboard/invoices');
  console.log('   ✓ POST /api/dashboard/service-request');
  console.log('   ✓ POST /api/dashboard/message');
  console.log('   ✓ POST /api/auth/login');
  console.log('\n');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('SIGINT', () => {
  console.log('\n👋 Server stopped');
  process.exit(0);
});
