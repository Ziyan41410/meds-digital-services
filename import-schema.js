require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function importSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
    });

    try {
        const schemaPath = path.join(__dirname, 'database', 'meds_schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        
        console.log('Importing database schema...');
        
        // Split statements by semicolon and execute each one individually
        const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i].trim();
            if (stmt) {
                try {
                    await connection.query(stmt);
                } catch (err) {
                    if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_ENTRY') {
                        // Table already exists or duplicate entry - skip
                    } else {
                        throw err;
                    }
                }
            }
        }
        
        console.log('✓ Database schema imported successfully!');
        
        // Verify tables exist
        const [tables] = await connection.query('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?', 
            [process.env.DB_NAME || 'meds_digital_services']);
        
        console.log(`✓ Found ${tables.length} tables:`);
        tables.forEach(t => console.log(`  - ${t.TABLE_NAME}`));
        
    } catch (err) {
        console.error('✗ Error importing schema:', err.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

importSchema();
