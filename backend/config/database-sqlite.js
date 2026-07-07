/**
 * SQLite Database Configuration - Development Alternative
 * Used when MySQL is not available
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname, '../../database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'meds_services.db');

// Create a wrapper to make sqlite3 act like mysql2/promise
class Database {
    constructor(dbPath) {
        this.dbPath = dbPath;
        this.db = null;
        this.init();
    }

    init() {
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('✗ SQLite connection failed:', err.message);
            } else {
                console.log('✓ SQLite database connection successful');
                this.setupTables();
            }
        });
    }

    setupTables() {
        const sql = `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                first_name TEXT,
                last_name TEXT,
                role_id INTEGER DEFAULT 2,
                profile_image TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS services (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price DECIMAL(10, 2),
                category_id INTEGER,
                is_active INTEGER DEFAULT 1,
                display_order INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER NOT NULL,
                service_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                budget DECIMAL(10, 2),
                timeline_days INTEGER,
                notes TEXT,
                status TEXT DEFAULT 'pending',
                priority TEXT DEFAULT 'medium',
                progress INTEGER DEFAULT 0,
                assigned_to INTEGER,
                paid INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                FOREIGN KEY (client_id) REFERENCES users(id),
                FOREIGN KEY (service_id) REFERENCES services(id)
            );

            CREATE TABLE IF NOT EXISTS project_comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                comment TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                title TEXT,
                message TEXT,
                related_id INTEGER,
                is_read INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        `;

        sql.split(';').forEach(statement => {
            if (statement.trim()) {
                this.db.run(statement, (err) => {
                    if (err && !err.message.includes('already exists')) {
                        console.error('Error creating table:', err.message);
                    }
                });
            }
        });

        // Insert default data
        this.insertDefaultData();
    }

    insertDefaultData() {
        // Insert roles
        const roles = [
            { id: 1, name: 'admin', description: 'Administrator' },
            { id: 2, name: 'client', description: 'Client' },
            { id: 3, name: 'programmer', description: 'Programmer' },
            { id: 4, name: 'marketer', description: 'Marketer' },
            { id: 5, name: 'cyber_security_expert', description: 'Cyber Security Expert' }
        ];

        roles.forEach(role => {
            this.db.run('INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)',
                [role.id, role.name, role.description]
            );
        });

        // Insert services
        const services = [
            { name: 'تطوير مواقع ويب', description: 'تطوير مواقع ويب احترافية', price: 50000, category_id: 1 },
            { name: 'تسويق رقمي', description: 'خدمات التسويق الرقمي الشاملة', price: 25000, category_id: 2 },
            { name: 'أمن سيبراني', description: 'خدمات الأمن السيبراني والحماية', price: 40000, category_id: 3 },
            { name: 'تطوير تطبيقات الجوال', description: 'تطوير تطبيقات iOS و Android', price: 45000, category_id: 1 },
            { name: 'استشارات تقنية', description: 'استشارات تقنية متخصصة', price: 15000, category_id: 4 }
        ];

        services.forEach(service => {
            this.db.run(
                'INSERT OR IGNORE INTO services (name, description, price, category_id, is_active) VALUES (?, ?, ?, ?, 1)',
                [service.name, service.description, service.price, service.category_id]
            );
        });

        console.log('✓ Default data inserted');
    }

    query(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (sql.toLowerCase().startsWith('select')) {
                this.db.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve([rows || [], null]);
                });
            } else if (sql.toLowerCase().startsWith('insert')) {
                this.db.run(sql, params, function(err) {
                    if (err) reject(err);
                    else resolve([{ insertId: this.lastID }, null]);
                });
            } else {
                this.db.run(sql, params, function(err) {
                    if (err) reject(err);
                    else resolve([{ affectedRows: this.changes }, null]);
                });
            }
        });
    }

    getConnection() {
        return Promise.resolve(this);
    }

    release() {
        // No-op for SQLite
    }
}

module.exports = new Database(dbPath);
