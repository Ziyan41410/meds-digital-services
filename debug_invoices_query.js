const pool = require('./backend/config/database');
(async () => {
  try {
    const q = "SELECT COUNT(*) AS total FROM invoices i LEFT JOIN users m ON i.manager_id = m.id WHERE m.department = 'systems'";
    console.log('QUERY', q);
    const [rows] = await pool.query(q);
    console.log('ROWS', rows);
    const [demo] = await pool.query('SELECT i.manager_id, m.department FROM invoices i LEFT JOIN users m ON i.manager_id = m.id LIMIT 5');
    console.log('DEMO', demo);
    pool.end();
  } catch (err) {
    console.error('ERROR', err.message);
    console.error(err.sql);
    pool.end();
    process.exit(1);
  }
})();