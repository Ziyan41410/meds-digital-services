#!/usr/bin/env node

/**
 * MEDS Digital Services - Startup & Setup Guide
 * 🚀 دليل البدء والإعداد
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🎯 MEDS DIGITAL SERVICES - SETUP & TROUBLESHOOTING        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);

// === COLORS ===
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

const log = {
    success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
    section: (msg) => console.log(`\n${colors.blue}📋 ${msg}${colors.reset}`),
};

// === STEP 1: CHECK NODE AND NPM ===
log.section('Step 1: Checking Node.js and npm');
try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    log.success(`Node.js: ${nodeVersion}`);
    log.success(`npm: ${npmVersion}`);
} catch (err) {
    log.error('Node.js or npm not found. Please install from https://nodejs.org');
    process.exit(1);
}

// === STEP 2: CHECK MYSQL ===
log.section('Step 2: Checking MySQL');
try {
    execSync('mysql --version', { encoding: 'utf8' });
    log.success('MySQL is installed');
} catch (err) {
    log.warn('MySQL not found in PATH. Make sure MySQL server is running!');
    log.info('Download: https://dev.mysql.com/downloads/mysql/');
}

// === STEP 3: CHECK ENVIRONMENT FILES ===
log.section('Step 3: Checking Environment Files');
const envExample = path.join(__dirname, '.env.example');
const envLocal = path.join(__dirname, '.env.local');

if (fs.existsSync(envLocal)) {
    log.success('.env.local exists');
    const envContent = fs.readFileSync(envLocal, 'utf8');
    if (envContent.includes('CLIENT_URL')) {
        log.success('CLIENT_URL is configured');
    } else {
        log.warn('CLIENT_URL might be missing from .env.local');
    }
} else {
    log.error('.env.local not found');
    log.info('Creating .env.local from .env.example...');
    if (fs.existsSync(envExample)) {
        fs.copyFileSync(envExample, envLocal);
        log.success('.env.local created');
    }
}

// === STEP 4: CHECK DATABASE SCHEMA ===
log.section('Step 4: Checking Database Schema');
const schemaFile = path.join(__dirname, 'database', 'meds_schema.sql');
if (fs.existsSync(schemaFile)) {
    const size = fs.statSync(schemaFile).size;
    log.success(`Database schema found (${(size / 1024).toFixed(2)} KB)`);
    log.info('Next: Run in PowerShell: mysql -u root < database\\meds_schema.sql');
} else {
    log.error('Database schema not found!');
}

// === STEP 5: CHECK PROJECT STRUCTURE ===
log.section('Step 5: Checking Project Structure');
const requiredDirs = [
    'backend',
    'backend/controllers',
    'backend/routes',
    'backend/models',
    'backend/middlewares',
    'backend/services',
    'backend/config',
    'frontend',
    'frontend/assets',
    'frontend/assets/js',
    'frontend/assets/css',
    'database',
];

const requiredFiles = [
    'backend/server.js',
    'backend/app.js',
    'backend/controllers/authController.js',
    'backend/models/User.js',
    'frontend/index.html',
    'frontend/assets/js/main.js',
    'package.json',
];

requiredDirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (fs.existsSync(fullPath)) {
        log.success(`${dir}/`);
    } else {
        log.error(`${dir}/ - MISSING`);
    }
});

console.log('');
requiredFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        log.success(file);
    } else {
        log.error(`${file} - MISSING`);
    }
});

// === STEP 6: INSTALLATION INSTRUCTIONS ===
log.section('Installation Steps');
console.log(`
1️⃣  Start MySQL Server:
    • Windows: Open MySQL Command Line Client
    • macOS: ${colors.cyan}brew services start mysql${colors.reset}
    • Linux: ${colors.cyan}sudo systemctl start mysql${colors.reset}

2️⃣  Create Database:
    ${colors.cyan}mysql -u root -p < database\\meds_schema.sql${colors.reset}
    (Leave password blank if not set)

3️⃣  Install Dependencies:
    ${colors.cyan}npm install${colors.reset}

4️⃣  Start Development Server:
    ${colors.cyan}npm run dev${colors.reset}

5️⃣  Open in Browser:
    ${colors.cyan}http://localhost:3000${colors.reset}
`);

// === QUICK TROUBLESHOOTING ===
log.section('Common Issues & Solutions');

console.log(`
${colors.yellow}❌ CORS Error: Origin not allowed${colors.reset}
   ✓ Check .env.local has CLIENT_URL
   ✓ Make sure URL includes http://localhost:3000

${colors.yellow}❌ 500 Error on register${colors.reset}
   ✓ Check MySQL is running
   ✓ Check database schema is imported
   ✓ Check .env.local database credentials

${colors.yellow}❌ npm ERR! mysql not found${colors.reset}
   ✓ Run: npm install
   ✓ Delete node_modules first if issues persist

${colors.yellow}❌ Port 3000 already in use${colors.reset}
   ✓ Windows: taskkill /PID <pid> /F
   ✓ macOS/Linux: kill -9 <pid>
   ✓ Or use different port in .env.local
`);

// === VERIFICATION COMMANDS ===
log.section('Verification Commands');
console.log(`
Test Database Connection:
  ${colors.cyan}node diagnostic.js${colors.reset}

Test API Health:
  ${colors.cyan}curl http://localhost:3000/health${colors.reset}

Test Registration (with curl):
  ${colors.cyan}curl -X POST http://localhost:3000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"first_name":"Test","last_name":"User","username":"testuser","email":"test@example.com","phone":"1234567890","password":"Test@1234","confirm_password":"Test@1234"}'${colors.reset}
`);

log.success('Setup guide complete!');
console.log(`
${colors.green}✨ Ready to start? Run: npm run dev${colors.reset}
`);
