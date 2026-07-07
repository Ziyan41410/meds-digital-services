/**
 * Database Migration Runner
 * Automatically applies migrations on startup
 * Falls back to mock mode if database is unavailable
 */

let pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
    try {
        // Test database connection
        try {
            await pool.query('SELECT 1');
            console.log('✅ Using MySQL database');
        } catch (err) {
            // If MySQL fails, run in mock mode
            console.warn('⚠️  MySQL unavailable, running in development mock mode');
            console.warn('⚠️  Database migrations skipped - using mock data');
            return; // Skip migrations in mock mode
        }

        const migrationsDir = path.join(__dirname, '../../database/migrations');
        
        // Create migrations table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Get list of migration files
        if (!fs.existsSync(migrationsDir)) {
            console.log('✓ No migrations directory found');
            return;
        }

        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        for (const file of files) {
            // Check if migration already executed
            const [result] = await pool.query(
                'SELECT id FROM migrations WHERE name = ?',
                [file]
            );

            if (result.length > 0) {
                console.log(`⊘ Migration skipped: ${file} (already applied)`);
                continue;
            }

            // Read and execute migration
            const sqlPath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(sqlPath, 'utf8')
                .split(/\r?\n/)
                .filter((line) => !line.trim().startsWith('--'))
                .join('\n');
            
            // Split by semicolon and execute each statement
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            for (const statement of statements) {
                await pool.query(statement);
            }

            // Record migration as executed
            await pool.query(
                'INSERT INTO migrations (name) VALUES (?)',
                [file]
            );

            console.log(`✓ Migration executed: ${file}`);
        }

    } catch (error) {
        console.error('✗ Migration error:', error.message);
        throw error;
    }
}

module.exports = runMigrations;
