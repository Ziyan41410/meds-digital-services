const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const mysql = require('mysql2/promise');
(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'information_schema'
    });
    const [rows] = await conn.query(
      "SELECT TABLE_NAME, COLUMN_NAME FROM COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('projects','services') ORDER BY TABLE_NAME, COLUMN_NAME",
      [process.env.DB_NAME || 'meds_digital_services']
    );
    console.log(JSON.stringify(rows, null, 2));
    await conn.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
