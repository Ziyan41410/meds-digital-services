#!/usr/bin/env node
/**
 * Simple Schema Importer
 * Imports database schema without multipleStatements
 */

require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const fs = require('fs');

async function run() {
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        const schemaFile = './database/meds_schema.sql';
        const sql = fs.readFileSync(schemaFile, 'utf-8');
        
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
                await conn.query(stmt);
                success++;
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
        console.log('✓ Database setup complete!');
        
    } catch (err) {
        console.error('✗ Fatal error:', err.message);
        process.exit(1);
    } finally {
        if (conn) await conn.end();
    }
}

run();
