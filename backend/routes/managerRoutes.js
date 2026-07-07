const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { verifyToken } = require('../middlewares/auth');

const managerRoleByDepartment = {
  systems: 'programmer',
  marketing: 'marketer',
  security: 'cyber_security_expert'
};

const router = express.Router();

const MANAGER_ROLES = new Set(['admin', 'programmer', 'marketer', 'cyber_security_expert']);
const STATUS_LABELS = {
  new: 'جديد',
  pending: 'قيد المراجعة',
  review: 'قيد المراجعة',
  pending_payment: 'بانتظار الدفع',
  in_progress: 'قيد التنفيذ',
  waiting_client: 'بانتظار العميل',
  on_hold: 'مؤجل',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  delayed: 'متأخر'
};

async function loadUserContext(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.department, u.role_id, r.name AS role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? AND u.is_active = 1`,
      [req.userId]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'المستخدم غير موجود' });
    }

    req.manager = rows[0];
    if (!MANAGER_ROLES.has(String(rows[0].role_name).toLowerCase())) {
      return res.status(403).json({ success: false, message: 'غير مصرح' });
    }

    next();
  } catch (error) {
    next(error);
  }
}

function departmentToDomain(department) {
  if (['marketing', 'mkt'].includes(department)) return 'mkt';
  if (['security', 'cyber_security', 'sec'].includes(department)) return 'sec';
  return 'dev';
}

function queryDepartmentToDomain(department) {
  if (!department || department === 'all') return null;
  if (['dev', 'systems', 'programming'].includes(department)) return 'dev';
  if (['mkt', 'marketing'].includes(department)) return 'mkt';
  if (['sec', 'security', 'cyber_security'].includes(department)) return 'sec';
  return null;
}

function roleDepartmentToDomain(roleName, department) {
  const role = String(roleName || '').toLowerCase();
  if (role === 'programmer') return 'dev';
  if (role === 'marketer') return 'mkt';
  if (role === 'cyber_security_expert') return 'sec';
  return departmentToDomain(department);
}

function isSuperAdminUser(user) {
  return Number(user.role_id) === 1 || String(user.role_name || '').toLowerCase() === 'admin';
}

router.use(verifyToken, loadUserContext);

router.get('/me', (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.manager.id,
      first_name: req.manager.first_name,
      last_name: req.manager.last_name,
      email: req.manager.email,
      role_name: req.manager.role_name,
      role_id: req.manager.role_id,
      department: req.manager.department
    }
  });
});

router.get('/dashboard', async (req, res, next) => {
  try {
    const isSuperAdmin = isSuperAdminUser(req.manager);
    const managerDomain = roleDepartmentToDomain(req.manager.role_name, req.manager.department);
    const selectedDomain = isSuperAdmin ? queryDepartmentToDomain(req.query.department) : managerDomain;
    const domainWhere = selectedDomain ? 'WHERE p.domain = ?' : '';
    const domainParams = selectedDomain ? [selectedDomain] : [];

    const [summaryRows] = await pool.query(
      `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN p.status = 'in_progress' THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN p.status IN ('pending', 'review') THEN 1 ELSE 0 END) AS pending_review,
        SUM(CASE WHEN p.status = 'waiting_client' THEN 1 ELSE 0 END) AS waiting_client,
        SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN p.status = 'delayed' THEN 1 ELSE 0 END) AS delayed_count,
        SUM(CASE WHEN p.priority = 'urgent' THEN 1 ELSE 0 END) AS urgent,
        SUM(CASE WHEN MONTH(p.created_at) = MONTH(CURDATE()) AND YEAR(p.created_at) = YEAR(CURDATE()) THEN 1 ELSE 0 END) AS this_month
      FROM projects p
      ${domainWhere}
      `,
      domainParams
    );

    const [ratingRows] = await pool.query(
      `
      SELECT p.domain,
             ROUND(AVG(r.rating), 2) AS avg_rating
      FROM reviews r
      JOIN projects p ON p.id = r.project_id
      WHERE r.is_visible = TRUE
        AND p.domain IN ('dev', 'mkt', 'sec')
      GROUP BY p.domain
      `
    );

    const ratingByDepartment = {
      dev: null,
      mkt: null,
      sec: null
    };
    ratingRows.forEach((row) => {
      if (row.domain && ratingByDepartment.hasOwnProperty(row.domain)) {
        ratingByDepartment[row.domain] = row.avg_rating;
      }
    });

    const [todaySummaryRows] = await pool.query(
      `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN p.status = 'completed' AND DATE(p.completed_at) = CURDATE() THEN 1 ELSE 0 END) AS completed
      FROM projects p
      WHERE DATE(p.created_at) = CURDATE()
      `
    );

    const [todayRatingRows] = await pool.query(
      `
      SELECT p.domain,
             ROUND(AVG(r.rating), 2) AS avg_rating
      FROM reviews r
      JOIN projects p ON p.id = r.project_id
      WHERE r.is_visible = TRUE
        AND DATE(r.created_at) = CURDATE()
        AND p.domain IN ('dev', 'mkt', 'sec')
      GROUP BY p.domain
      `
    );

    const todayRatingByDepartment = {
      dev: null,
      mkt: null,
      sec: null
    };
    todayRatingRows.forEach((row) => {
      if (row.domain && todayRatingByDepartment.hasOwnProperty(row.domain)) {
        todayRatingByDepartment[row.domain] = row.avg_rating;
      }
    });

    const [todayClientRows] = await pool.query(
      `
      SELECT COUNT(DISTINCT u.id) AS totalClients
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE LOWER(r.name) = 'client' AND u.is_active = 1
        AND DATE(u.created_at) = CURDATE()
      `
    );

    const [platformAgeRows] = await pool.query(
      `
      SELECT COALESCE(DATEDIFF(CURDATE(), MIN(created_at)) + 1, 0) AS platform_days
      FROM (
        SELECT created_at FROM projects
        UNION ALL
        SELECT created_at FROM users
      ) t
      `
    );

    const [clientRows] = await pool.query(
      `
      SELECT COUNT(DISTINCT u.id) AS totalClients
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE LOWER(r.name) = 'client' AND u.is_active = 1
      `
    );

    const [orders] = await pool.query(
      `
      SELECT p.id, p.title, p.description, p.status, p.priority, p.progress, p.domain,
             p.created_at, p.end_date AS deadline, p.start_date, p.assigned_to,
             CONCAT(u.first_name, ' ', u.last_name) AS client_name,
             s.name AS service_name
      FROM projects p
      JOIN users u ON p.client_id = u.id
      LEFT JOIN services s ON p.service_id = s.id
      ${domainWhere}
      ORDER BY p.created_at DESC
      LIMIT 20
      `,
      domainParams
    );

    const [departmentRows] = await pool.query(
      `
      SELECT p.domain,
             COUNT(*) AS total,
             SUM(CASE WHEN p.status = 'in_progress' THEN 1 ELSE 0 END) AS active,
             SUM(CASE WHEN p.status IN ('pending', 'review') THEN 1 ELSE 0 END) AS pending
      FROM projects p
      WHERE p.domain IS NOT NULL
      GROUP BY p.domain
      `
    );

    let activity = [];
    try {
      const [activityRows] = await pool.query(
        `
        SELECT al.id, al.action, al.resource_type, al.resource_id, al.created_at,
               CONCAT(u.first_name, ' ', u.last_name) AS actor_name
        FROM audit_logs al
        JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT 8
        `
      );

      activity = activityRows.map((row) => ({
        id: row.id,
        title: row.action.replace(/_/g, ' ').toLowerCase(),
        subtitle: `${row.actor_name} • ${row.resource_type}`,
        timestamp: row.created_at
      }));
    } catch (auditError) {
      const [fallback] = await pool.query(
        `
        SELECT p.id, p.status, p.priority, p.created_at,
               CONCAT(u.first_name, ' ', u.last_name) AS client_name
        FROM projects p
        JOIN users u ON p.client_id = u.id
        ${domainWhere}
        ORDER BY p.updated_at DESC
        LIMIT 8
        `,
        domainParams
      );

      activity = fallback.map((row) => ({
        id: row.id,
        title: `تم تحديث الطلب #${row.id}`,
        subtitle: `${row.client_name} • ${STATUS_LABELS[row.status] || row.status}`,
        timestamp: row.created_at
      }));
    }

    const summary = summaryRows[0] || {};
    summary.ratings_by_department = ratingByDepartment;
    summary.platform_days = platformAgeRows[0]?.platform_days ?? 0;
    summary.totalClients = clientRows[0]?.totalClients ?? 0;
    summary.today_total = todaySummaryRows[0]?.total ?? 0;
    summary.today_completed = todaySummaryRows[0]?.completed ?? 0;
    summary.today_totalClients = todayClientRows[0]?.totalClients ?? 0;
    summary.today_ratings_by_department = todayRatingByDepartment;

    const priorityCounts = {
      urgent: orders.filter((order) => order.priority === 'urgent').length,
      high: orders.filter((order) => order.priority === 'high').length,
      medium: orders.filter((order) => order.priority === 'medium').length,
      low: orders.filter((order) => order.priority === 'low').length
    };

    res.json({
      success: true,
      data: {
        manager: req.manager,
        scope: {
          isSuperAdmin,
          selectedDomain: selectedDomain || 'all',
          managerDomain,
          availableDepartments: isSuperAdmin ? ['all', 'dev', 'mkt', 'sec'] : [managerDomain]
        },
        summary,
        orders,
        activity,
        departments: departmentRows,
        priorityCounts,
        hero: {
          workload: Number(summary.urgent || 0) > 0 ? 'ضغط مرتفع' : 'مستقر',
          updatedAt: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const isSuperAdmin = isSuperAdminUser(req.manager);
    if (!isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'غير مصرح لإدارة المستخدمين' });
    }

    const { department, q, role, limit = 25 } = req.query;
    const selectedDomain = queryDepartmentToDomain(department);
    let where = 'WHERE 1=1';
    const params = [];

    if (selectedDomain) {
      const departmentName = selectedDomain === 'dev' ? 'systems' : selectedDomain === 'mkt' ? 'marketing' : 'security';
      where += ' AND (u.department = ? OR p.domain = ?)';
      params.push(departmentName, selectedDomain);
    }

    if (role) {
      where += ' AND LOWER(r.name) = ?';
      params.push(String(role).toLowerCase());
    }

    if (q) {
      where += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.username LIKE ?)';
      const term = `%${q}%`;
      params.push(term, term, term, term);
    }

    const [users] = await pool.query(
      `
      SELECT u.id, u.first_name, u.last_name, u.username, u.email, u.phone,
             u.department, u.is_active, u.created_at, u.role_id, r.name AS role_name,
             COUNT(DISTINCT p.id) AS projects_count
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN projects p ON p.client_id = u.id OR p.assigned_to = u.id
      ${where}
      GROUP BY u.id, u.first_name, u.last_name, u.username, u.email, u.phone,
               u.department, u.is_active, u.created_at, u.role_id, r.name
      ORDER BY u.created_at DESC
      LIMIT ?
      `,
      [...params, parseInt(limit, 10)]
    );

    res.json({ success: true, data: { users } });
  } catch (error) {
    next(error);
  }
});

router.post('/users/:id/change-password', async (req, res, next) => {
  try {
    const isSuperAdmin = isSuperAdminUser(req.manager);
    if (!isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'غير مصرح لإدارة المستخدمين' });
    }

    const userId = Number(req.params.id);
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال كلمة المرور الحالية والجديدة' });
    }
    if (String(new_password).length < 6) {
      return res.status(400).json({ success: false, message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });
    }

    const [userRows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (!userRows.length) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    const valid = await bcrypt.compare(current_password, userRows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'كلمة السر الحالية غير صحيحة' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);

    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    next(error);
  }
});

router.post('/users', async (req, res, next) => {
  try {
    const isSuperAdmin = isSuperAdminUser(req.manager);
    if (!isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'غير مصرح لإدارة المستخدمين' });
    }

    const { first_name, last_name, email, phone, department, role, password } = req.body;
    if (!first_name || !last_name || !email || !phone || !department) {
      return res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
    }

    const firstName = String(first_name).trim();
    const lastName = String(last_name).trim();
    const emailValue = String(email).trim();
    const phoneValue = String(phone).trim();

    if (/\d/.test(firstName) || /\d/.test(lastName)) {
      return res.status(400).json({ success: false, message: 'لا يمكن أن يحتوي الاسم على أرقام' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال بريد إلكتروني صالح' });
    }
    if (!/^\+?[0-9]{8,15}$/.test(phoneValue)) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال رقم هاتف صحيح' });
    }

    const departmentKey = String(department).toLowerCase();
    if (!['systems', 'marketing', 'security'].includes(departmentKey)) {
      return res.status(400).json({ success: false, message: 'القسم غير صالح' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [emailValue]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'البريد الإلكتروني مسجل بالفعل' });
    }

    const roleName = String(role || managerRoleByDepartment[departmentKey]).toLowerCase();
    const [roleRows] = await pool.query('SELECT id FROM roles WHERE name = ?', [roleName]);
    if (!roleRows.length) {
      return res.status(400).json({ success: false, message: 'الدور غير موجود' });
    }

    const newPassword = password && String(password).trim().length >= 6 ? String(password).trim() : Math.random().toString(36).slice(-10);
    if (password && String(password).trim().length < 6) {
      return res.status(400).json({ success: false, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `INSERT INTO users (first_name, last_name, email, phone, password_hash, role_id, department, is_manager, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)`,
      [firstName, lastName, emailValue, phoneValue, passwordHash, roleRows[0].id, departmentKey]
    );

    res.status(201).json({ success: true, message: 'تم إنشاء المسؤول بنجاح' });
  } catch (error) {
    next(error);
  }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    const isSuperAdmin = isSuperAdminUser(req.manager);
    if (!isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'غير مصرح لإدارة المستخدمين' });
    }

    const userId = Number(req.params.id);
    if (userId === Number(req.manager.id)) {
      return res.status(400).json({ success: false, message: 'لا يمكن حذف حسابك الحالي' });
    }

    const [userRows] = await pool.query('SELECT id, is_active FROM users WHERE id = ?', [userId]);
    if (!userRows.length) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    await pool.query('UPDATE projects SET client_id = NULL WHERE client_id = ?', [userId]);
    await pool.query('UPDATE projects SET assigned_to = NULL WHERE assigned_to = ?', [userId]);
    await pool.query('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [userId, userId]);
    await pool.query('DELETE FROM project_comments WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM files WHERE uploaded_by = ?', [userId]);
    await pool.query('DELETE FROM payments WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM invoices WHERE client_id = ?', [userId]);
    await pool.query('DELETE FROM reviews WHERE client_id = ? OR professional_id = ?', [userId, userId]);
    await pool.query('DELETE FROM portfolio WHERE professional_id = ?', [userId]);
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id', async (req, res, next) => {
  try {
    const isSuperAdmin = isSuperAdminUser(req.manager);
    if (!isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'غير مصرح لإدارة المستخدمين' });
    }

    const isSelfUpdate = Number(req.params.id) === Number(req.manager.id);
    if (isSelfUpdate && req.body.is_active !== undefined && req.body.is_active !== true) {
      return res.status(400).json({ success: false, message: 'لا يمكن تعطيل حسابك الحالي' });
    }

    const updates = [];
    const params = [];

    if (req.body.first_name !== undefined) {
      updates.push('first_name = ?');
      params.push(req.body.first_name);
    }
    if (req.body.last_name !== undefined) {
      updates.push('last_name = ?');
      params.push(req.body.last_name);
    }
    if (req.body.email !== undefined) {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [req.body.email, req.params.id]);
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'البريد الإلكتروني مسجل بالفعل' });
      }
      updates.push('email = ?');
      params.push(req.body.email);
    }
    if (req.body.phone !== undefined) {
      const [existingPhone] = await pool.query('SELECT id FROM users WHERE phone = ? AND id != ?', [req.body.phone, req.params.id]);
      if (existingPhone.length > 0) {
        return res.status(409).json({ success: false, message: 'رقم الهاتف مسجل بالفعل' });
      }
      updates.push('phone = ?');
      params.push(req.body.phone);
    }
    if (req.body.department !== undefined) {
      updates.push('department = ?');
      params.push(req.body.department || null);
    }
    if (req.body.is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(req.body.is_active ? 1 : 0);
    }
    if (req.body.password !== undefined) {
      if (req.body.password && String(req.body.password).trim().length < 6) {
        return res.status(400).json({ success: false, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
      }
      if (req.body.password) {
        const passwordHash = await bcrypt.hash(String(req.body.password).trim(), 10);
        updates.push('password_hash = ?');
        params.push(passwordHash);
      }
    }

    if (!updates.length) {
      return res.status(400).json({ success: false, message: 'لا توجد تغييرات' });
    }

    params.push(req.params.id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'تم تحديث المستخدم' });
  } catch (error) {
    next(error);
  }
});

router.get('/orders', async (req, res, next) => {
  try {
    const { status, priority, q, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const isSuperAdmin = isSuperAdminUser(req.manager);
    const departmentDomain = departmentToDomain(req.manager.department);

    let where = `WHERE 1=1`;
    const params = [];

    if (!isSuperAdmin) {
      where += ` AND p.domain = ?`;
      params.push(departmentDomain);
    }

    if (status) {
      where += ` AND p.status = ?`;
      params.push(status);
    }

    if (priority) {
      where += ` AND p.priority = ?`;
      params.push(priority);
    }

    if (q) {
      where += ` AND (p.title LIKE ? OR p.description LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
      const term = `%${q}%`;
      params.push(term, term, term, term);
    }

    const [orders] = await pool.query(
      `
      SELECT p.id, p.title, p.description, p.status, p.priority, p.progress, p.domain,
             p.created_at, p.end_date AS deadline, p.start_date, p.assigned_to,
             CONCAT(u.first_name, ' ', u.last_name) AS client_name,
             s.name AS service_name
      FROM projects p
      JOIN users u ON p.client_id = u.id
      LEFT JOIN services s ON p.service_id = s.id
      ${where}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...params, parseInt(limit, 10), offset]
    );

    const [countRows] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM projects p
      JOIN users u ON p.client_id = u.id
      ${where}
      `,
      params
    );

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total: countRows[0].total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages: Math.ceil(countRows[0].total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/orders/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT p.*, CONCAT(u.first_name, ' ', u.last_name) AS client_name,
             u.email AS client_email, s.name AS service_name
      FROM projects p
      JOIN users u ON p.client_id = u.id
      LEFT JOIN services s ON p.service_id = s.id
      WHERE p.id = ?
      LIMIT 1
      `,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    const isSuperAdmin = isSuperAdminUser(req.manager);
    const departmentDomain = departmentToDomain(req.manager.department);
    if (!isSuperAdmin && rows[0].domain !== departmentDomain) {
      return res.status(403).json({ success: false, message: 'غير مصرح لهذا القسم' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
});

router.patch('/orders/:id', async (req, res, next) => {
  try {
    const { status, priority, progress, notes, start_date, end_date } = req.body;

    const [existing] = await pool.query(
      'SELECT id, client_id, domain FROM projects WHERE id = ?',
      [req.params.id]
    );

    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    const isSuperAdmin = isSuperAdminUser(req.manager);
    const departmentDomain = departmentToDomain(req.manager.department);
    if (!isSuperAdmin && existing[0].domain !== departmentDomain) {
      return res.status(403).json({ success: false, message: 'غير مصرح لهذا القسم' });
    }

    const updates = [];
    const values = [];
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (priority !== undefined) { updates.push('priority = ?'); values.push(priority); }
    if (progress !== undefined) { updates.push('progress = ?'); values.push(Number(progress) || 0); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes || null); }
    if (start_date !== undefined) { updates.push('start_date = ?'); values.push(start_date || null); }
    if (end_date !== undefined) { updates.push('end_date = ?'); values.push(end_date || null); }

    if (!updates.length) {
      return res.status(400).json({ success: false, message: 'لا توجد تغييرات' });
    }

    values.push(req.params.id);
    await pool.query(
      `UPDATE projects SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    if (req.app?.io) {
      ['admin', 'programmer', 'marketer', 'cyber_security_expert', 'client'].forEach((role) => {
        req.app.io.to(`dashboard:${role}`).emit('stats:updated', { timestamp: new Date() });
        req.app.io.to(`dashboard:${role}`).emit('stats:update', { timestamp: new Date() });
      });
    }

    await pool.query(
      `INSERT INTO notifications (user_id, title, message)
       VALUES (?, ?, ?)`,
      [existing[0].client_id, 'تم تحديث طلبك', 'تم تحديث تفاصيل الطلب من قبل المدير المختص']
    );

    res.json({ success: true, message: 'تم تحديث الطلب بنجاح' });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const isSuperAdmin = isSuperAdminUser(req.manager);
    const departmentDomain = departmentToDomain(req.manager.department);
    const baseWhere = isSuperAdmin ? '' : 'WHERE domain = ?';
    const baseParams = isSuperAdmin ? [] : [departmentDomain];

    const [summary] = await pool.query(
      `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN status IN ('pending','review') THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
      FROM projects
      ${baseWhere}
      `,
      baseParams
    );

    const pendingQuery = isSuperAdmin
      ? 'SELECT COUNT(*) AS total FROM projects WHERE status IN (\'pending\', \'review\')'
      : 'SELECT COUNT(*) AS total FROM projects WHERE domain = ? AND status IN (\'pending\', \'review\')';
    const [pendingApprovals] = await pool.query(pendingQuery, baseParams);

    res.json({
      success: true,
      data: {
        summary: summary[0],
        pendingApprovals: pendingApprovals[0].total
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
