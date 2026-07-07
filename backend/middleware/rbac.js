const pool = require('../config/database');

const logAudit = async ({
  userId,
  action,
  resourceType,
  resourceId = null,
  oldValues = null,
  newValues = null,
  ipAddress = null
}) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs
       (user_id, action, resource_type, resource_id, old_values, new_values, ip_address, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        action,
        resourceType,
        resourceId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress
      ]
    );
  } catch (error) {
    console.warn('Audit log skipped:', error.message);
  }
};

module.exports = { logAudit };
