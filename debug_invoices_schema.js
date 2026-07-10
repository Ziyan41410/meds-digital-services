const pool = require('./backend/config/database');
(async () => {
  try {
    const [rows] = await pool.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='invoices' ORDER BY ORDINAL_POSITION");
    console.log(rows.map(r => r.COLUMN_NAME).join(', '));
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err.message);
    process.exit(1);
  }
})();
