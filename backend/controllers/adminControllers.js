// ══════════════════════════════════════════════════════
// Admin Controllers
// معالجات طلبات المدير الرئيسي (Super Admin Only)
// ══════════════════════════════════════════════════════

const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { logAudit } = require('../middleware/rbac');

const managerRoleByDepartment = {
  systems: 'programmer',
  marketing: 'marketer',
  security: 'cyber_security_expert'
};

/**
 * ════════════════════════════════════════
 * USER MANAGEMENT
 * ════════════════════════════════════════
 */

/**
 * Get all users with filters
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { role, department, isActive = true, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE 1=1';
    const params = [];

    if (role) {
      query += ' AND r.name = ?';
      params.push(role);
    }

    if (department) {
      query += ' AND u.department = ?';
      params.push(department);
    }

    if (isActive !== undefined) {
      query += ' AND u.is_active = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }

    if (search) {
      query += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [users] = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM users u JOIN roles r ON u.role_id = r.id WHERE 1=1';
    const countParams = [];

    if (role) {
      countQuery += ' AND r.name = ?';
      countParams.push(role);
    }
    if (department) {
      countQuery += ' AND u.department = ?';
      countParams.push(department);
    }
    if (isActive !== undefined) {
      countQuery += ' AND u.is_active = ?';
      countParams.push(isActive === 'true' ? 1 : 0);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].count;

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to get users'
    });
  }
};

/**
 * Create new manager
 */
exports.createManager = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, department, role } = req.body;

    // Validate department for managers
    if (!['systems', 'marketing', 'security'].includes(department)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_DEPARTMENT',
        message: 'Invalid department for manager'
      });
    }

    // Check if email exists
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'CONFLICT',
        message: 'Email already exists'
      });
    }

    // Get role ID
    const [roleResult] = await db.query(
      'SELECT id FROM roles WHERE name = ?',
      [role || managerRoleByDepartment[department]]
    );

    if (!roleResult.length) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ROLE',
        message: 'Role not found'
      });
    }

    // Generate temporary password
    const tempPassword = uuidv4().substring(0, 12);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Create manager
    const [result] = await db.query(
      `INSERT INTO users 
       (first_name, last_name, email, phone, password_hash, role_id, department, is_manager, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)`,
      [firstName, lastName, email, phone, passwordHash, roleResult[0].id, department]
    );

    const managerId = result.insertId;

    // Log audit
    await logAudit({
      userId: req.user.id,
      action: 'MANAGER_CREATED',
      resourceType: 'users',
      resourceId: managerId,
      newValues: { firstName, lastName, email, department },
      ipAddress: req.ip
    });

    // TODO: Send email with temporary password

    res.status(201).json({
      success: true,
      message: 'Manager created successfully',
      data: {
        id: managerId,
        email,
        tempPassword // Only show on creation
      }
    });
  } catch (error) {
    console.error('Create manager error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to create manager'
    });
  }
};

/**
 * Update user
 */
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, phone, isActive, department } = req.body;

    // Get old values for audit
    const [oldUser] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (!oldUser.length) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    // Update user
    const updates = [];
    const values = [];

    if (firstName !== undefined) {
      updates.push('first_name = ?');
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push('last_name = ?');
      values.push(lastName);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(isActive ? 1 : 0);
    }
    if (department !== undefined) {
      updates.push('department = ?');
      values.push(department);
    }

    values.push(userId);

    if (updates.length > 0) {
      await db.query(
        `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
        values
      );
    }

    // Log audit
    await logAudit({
      userId: req.user.id,
      action: 'USER_UPDATED',
      resourceType: 'users',
      resourceId: userId,
      oldValues: oldUser[0],
      newValues: req.body,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to update user'
    });
  }
};

/**
 * Delete user (soft delete)
 */
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent self-deletion
    if (userId === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'You cannot delete your own account'
      });
    }

    // Soft delete
    await db.query(
      'UPDATE users SET is_active = 0, deleted_at = NOW() WHERE id = ?',
      [userId]
    );

    // Log audit
    await logAudit({
      userId: req.user.id,
      action: 'USER_DELETED',
      resourceType: 'users',
      resourceId: userId,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to delete user'
    });
  }
};

/**
 * ════════════════════════════════════════
 * ANALYTICS & REPORTS
 * ════════════════════════════════════════
 */

/**
 * Get dashboard statistics
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // Total users
    const [userStats] = await db.query(
      'SELECT COUNT(*) as total, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active FROM users'
    );

    // Active orders
    const [orderStats] = await db.query(
      `SELECT COUNT(*) as total, 
              SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as active,
              SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
       FROM projects`
    );

    // Revenue this month
    const [revenueStats] = await db.query(
      `SELECT SUM(amount) as total FROM invoices 
       WHERE YEAR(created_at) = YEAR(CURDATE()) 
       AND MONTH(created_at) = MONTH(CURDATE())
       AND status = 'paid'`
    );

    // Completion rate
    const [completionStats] = await db.query(
      `SELECT 
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(*) as total
       FROM projects
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`
    );

    const completionRate = completionStats[0].total > 0 
      ? Math.round((completionStats[0].completed / completionStats[0].total) * 100)
      : 0;

    // Orders by department
    const [deptStats] = await db.query(
      `SELECT domain AS department, COUNT(*) as count FROM projects 
       WHERE domain IS NOT NULL AND status != 'cancelled'
       GROUP BY domain`
    );

    res.json({
      success: true,
      data: {
        totalUsers: userStats[0].total,
        activeUsers: userStats[0].active,
        activeOrders: orderStats[0].active,
        totalOrders: orderStats[0].total,
        pendingOrders: orderStats[0].pending,
        monthlyRevenue: revenueStats[0].total || 0,
        completionRate,
        ordersByDepartment: deptStats
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to get statistics'
    });
  }
};

/**
 * Get audit log
 */
exports.getAuditLog = async (req, res) => {
  try {
    const { userId, action, startDate, endDate, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }

    if (startDate) {
      query += ' AND created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND created_at <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [logs] = await db.query(query, params);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to get audit log'
    });
  }
};

/**
 * Export data to CSV
 */
exports.exportData = async (req, res) => {
  try {
    const { type, format = 'csv' } = req.query;

    let data = [];
    let filename = '';

    if (type === 'users') {
      const [users] = await db.query(
        'SELECT id, first_name, last_name, email, phone, is_active, created_at FROM users'
      );
      data = users;
      filename = 'users';
    } else if (type === 'orders') {
      const [orders] = await db.query(
        'SELECT id, title, domain AS department, status, client_id, assigned_to, created_at FROM projects'
      );
      data = orders;
      filename = 'orders';
    } else if (type === 'invoices') {
      const [invoices] = await db.query(
        'SELECT id, invoice_number, amount, status, due_date, paid_date FROM invoices'
      );
      data = invoices;
      filename = 'invoices';
    }

    if (format === 'csv') {
      // Convert to CSV
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csv);
    } else if (format === 'json') {
      res.json({
        success: true,
        data
      });
    }
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to export data'
    });
  }
};

// Helper function to convert array to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  return csvContent;
}

module.exports = {
  getAllUsers,
  createManager,
  updateUser,
  deleteUser,
  getDashboardStats,
  getAuditLog,
  exportData
};
