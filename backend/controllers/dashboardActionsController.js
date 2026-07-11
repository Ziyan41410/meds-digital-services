/**
 * Dashboard Actions Controller
 * Handles quick actions: service requests, messages, invoices.
 */

const pool = require('../config/database');

const normalizePriority = (priority) => {
    if (['low', 'medium', 'high', 'urgent'].includes(priority)) return priority;
    if (priority === 'normal') return 'medium';
    return 'medium';
};

const normalizeDomain = (domain) => {
    if (['dev', 'mkt', 'sec'].includes(domain)) return domain;
    return null;
};

const toJsonOrNull = (value) => {
    if (value === undefined || value === null || value === '') return null;
    return typeof value === 'string' ? value : JSON.stringify(value);
};

const inferDomain = (serviceName, categorySlug, requestedDomain) => {
    const normalized = normalizeDomain(requestedDomain);
    if (normalized) return normalized;
    if (categorySlug === 'marketing') return 'mkt';
    if (categorySlug === 'cyber_security') return 'sec';
    if (serviceName.includes('تسويق')) return 'mkt';
    if (serviceName.includes('أمن') || serviceName.includes('سيبر')) return 'sec';
    return 'dev';
};

exports.createServiceRequest = async (req, res) => {
    try {
        const {
            service_id,
            title,
            description,
            budget,
            budget_range,
            deadline_days,
            timeline_days,
            priority,
            notes,
            domain,
            form_data,
            attachments
        } = req.body;
        const clientId = req.userId;
        const serviceId = Number(service_id);

        if (!serviceId || !title || !description) {
            return res.status(400).json({
                success: false,
                message: 'البيانات المطلوبة غير مكتملة'
            });
        }

        const [services] = await pool.query(
            `SELECT s.id, s.name, sc.slug AS category_slug
             FROM services s
             LEFT JOIN service_categories sc ON s.category_id = sc.id
             WHERE s.id = ?`,
            [serviceId]
        );

        if (services.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'الخدمة المحددة غير موجودة في قاعدة البيانات'
            });
        }

        const [result] = await pool.query(
            `INSERT INTO projects
                (client_id, service_id, domain, title, description, form_data, budget, budget_range, timeline_days, notes, attachments, status, priority)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
            [
                clientId,
                serviceId,
                inferDomain(services[0].name || '', services[0].category_slug, domain),
                title,
                description,
                toJsonOrNull(form_data),
                budget || null,
                budget_range || null,
                deadline_days || timeline_days || null,
                notes || null,
                toJsonOrNull(attachments),
                normalizePriority(priority)
            ]
        );

        const [admins] = await pool.query(
            `SELECT u.id
             FROM users u
             JOIN roles r ON u.role_id = r.id
             WHERE LOWER(r.name) = 'admin'`
        );

        for (const admin of admins) {
            try {
                await pool.query(
                    `INSERT INTO messages (sender_id, receiver_id, message)
                     VALUES (?, ?, ?)`,
                    [clientId, admin.id, `طلب خدمة جديد: ${title}`]
                );
            } catch (e) {
                console.warn('Warning: Could not insert message notification:', e.message);
            }
        }

        res.status(201).json({
            success: true,
            message: 'تم إرسال طلب الخدمة بنجاح',
            project_id: result.insertId
        });
    } catch (error) {
        console.error('Create service request error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إرسال الطلب',
            error: error.message
        });
    }
};

exports.sendMessageToTeam = async (req, res) => {
    try {
        const { message, project_id } = req.body;
        const senderId = req.userId;

        if (!message || !project_id) {
            return res.status(400).json({
                success: false,
                message: 'الرسالة ومعرف المشروع مطلوبان'
            });
        }

        const [project] = await pool.query(
            'SELECT id, assigned_to FROM projects WHERE id = ? AND client_id = ?',
            [project_id, senderId]
        );

        if (project.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحيات للوصول لهذا المشروع'
            });
        }

        const [result] = await pool.query(
            `INSERT INTO project_comments (project_id, user_id, comment)
             VALUES (?, ?, ?)`,
            [project_id, senderId, message]
        );

        if (project[0].assigned_to) {
            try {
                await pool.query(
                    `INSERT INTO messages (sender_id, receiver_id, message, related_project_id)
                     VALUES (?, ?, ?, ?)`,
                    [senderId, project[0].assigned_to, message, project_id]
                );
            } catch (e) {
                console.warn('Warning: Could not insert message notification:', e.message);
            }
        }

        res.json({
            success: true,
            message: 'تم إرسال الرسالة بنجاح',
            comment_id: result.insertId
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إرسال الرسالة',
            error: error.message
        });
    }
};

exports.getInvoices = async (req, res) => {
    try {
        const clientId = req.userId;
        const { status = 'all', page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const offset = (pageNum - 1) * limitNum;
        // Determine if requester is a manager/admin
        const [userRows] = await pool.query(
            `SELECT u.id, r.name as role_name, u.department
             FROM users u
             LEFT JOIN roles r ON u.role_id = r.id
             WHERE u.id = ?`,
            [clientId]
        );
        const roleName = (userRows[0] && userRows[0].role_name) ? String(userRows[0].role_name).toLowerCase() : '';
        const MANAGER_ROLES = new Set(['admin', 'programmer', 'marketer', 'cyber_security_expert']);
        const isManager = MANAGER_ROLES.has(roleName);

        // If manager, allow fetching invoices across clients; optionally filter by department
        const departmentFilter = req.query.department || null;

        let baseQuery = `
            SELECT
                p.id,
                p.title,
                p.budget AS amount,
                p.status,
                p.created_at AS invoice_date,
                p.updated_at AS due_date,
                s.name AS service_name,
                p.client_id,
                CASE
                    WHEN p.status = 'completed' THEN 'معلق'
                    ELSE 'قيد المراجعة'
                END AS payment_status
            FROM projects p
            JOIN services s ON p.service_id = s.id
        `;

        const params = [];
        let whereClauses = [];

        if (!isManager) {
            whereClauses.push('p.client_id = ?');
            params.push(clientId);
        }

        if (status !== 'all') {
            whereClauses.push('p.status = ?');
            params.push(status);
        }

        if (departmentFilter) {
            whereClauses.push('p.domain = ?');
            params.push(departmentFilter);
        }

        const whereSql = whereClauses.length ? ('WHERE ' + whereClauses.join(' AND ')) : '';

        // Count total for pagination
        const countSql = `SELECT COUNT(*) as total FROM projects ${whereSql}`;
        const [countResult] = await pool.query(countSql, params);

        // Inline numeric LIMIT/OFFSET after validation to avoid prepared-statement binding issues
        const finalQuery = `${baseQuery} ${whereSql} ORDER BY p.created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;
        const [invoices] = await pool.query(finalQuery, params);

        res.json({
            success: true,
            data: invoices,
            pagination: {
                current_page: parseInt(page, 10),
                total_pages: Math.ceil((countResult[0] && countResult[0].total) ? countResult[0].total / limit : 0),
                total_items: (countResult[0] && countResult[0].total) ? countResult[0].total : 0
            }
        });
    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الفواتير',
            error: error.message
        });
    }
};

exports.getAvailableServices = async (req, res) => {
    try {
        const [services] = await pool.query(
            `SELECT s.id, s.name, s.slug, s.description, s.price, s.duration_days, sc.slug AS category
             FROM services s
             LEFT JOIN service_categories sc ON s.category_id = sc.id
             ORDER BY name`
        );

        res.json({
            success: true,
            data: services
        });
    } catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الخدمات',
            error: error.message
        });
    }
};

exports.getProjectMessages = async (req, res) => {
    try {
        const { projectId } = req.params;
        const clientId = req.userId;

        const [project] = await pool.query(
            'SELECT id FROM projects WHERE id = ? AND client_id = ?',
            [projectId, clientId]
        );

        if (project.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحيات'
            });
        }

        const [comments] = await pool.query(
            `SELECT pc.id, pc.comment, pc.created_at, u.first_name, u.last_name, u.profile_image
             FROM project_comments pc
             JOIN users u ON pc.user_id = u.id
             WHERE pc.project_id = ?
             ORDER BY pc.created_at DESC`,
            [projectId]
        );

        res.json({
            success: true,
            data: comments
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الرسائل',
            error: error.message
        });
    }
};
