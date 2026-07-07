const mysql = require('mysql2/promise');
const fs = require('fs');

async function runMigration() {
    let conn;
    try {
        conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: ''
        });

        await conn.query('USE meds_digital_services');

        const sql = fs.readFileSync('./database/migrations/004_add_domain_field.sql', 'utf-8');

        // Split by ; and execute each statement
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s && !s.startsWith('--'));

        console.log(`📋 Found ${statements.length} SQL statements`);
        let success = 0;
        let skipped = 0;

        for (const stmt of statements) {
            try {
                if (stmt) {
                    await conn.query(stmt + ';');
                    success++;
                }
            } catch (e) {
                if (e.code === 'ER_TABLE_EXISTS_ERROR' || e.code === 'ER_DUP_ENTRY' ||
                    e.message.includes('already exists') || e.message.includes('Duplicate')) {
                    skipped++;
                } else {
                    console.error(`❌ Error: ${e.message.substring(0, 100)}`);
                }
            }
        }

        console.log(`✅ Executed: ${success}, Skipped: ${skipped}`);
        console.log('✓ Migration complete!');

    } catch (err) {
        console.error('✗ Fatal error:', err.message);
        process.exit(1);
    } finally {
        if (conn) await conn.end();
    }
}

runMigration();
