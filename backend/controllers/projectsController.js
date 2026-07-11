/**
Projects Controller
Handles project creation and management
*/
const pool = require('../config/database');

// ===== CREATE PROJECT =====
const createProject = async (req, res) => {
    try {
        const { service_id, title, description, budget, timeline_days, notes } = req.body;
        const clientId = req.userId;

        const [result] = await pool.query(
            `INSERT INTO projects (client_id, service_id, title, description, budget, timeline_days, notes, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [clientId, service_id, title, description, budget, timeline_days, notes || null]
        );

        const projectId = result.insertId;

        // Create notification for admin
        const [admins] = await pool.query(
            `SELECT u.id FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE r.name = 'admin'`
        );

        for (const admin of admins) {
            await pool.query(
                `INSERT INTO notifications (user_id, type, title, message, related_id)
                 VALUES (?, 'project_created', ?, ?, ?)`,
                [admin.id, `مشروع جديد: ${title}`, `تم إنشاء مشروع جديد من قبل العميل`, projectId]
            );
        }

        res.status(201).json({
            success: true,
            message: 'تم إنشاء المشروع بنجاح',
            project_id: projectId
        });

    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إنشاء المشروع',
            error: error.message
        });
    }
};

// ===== GET CLIENT PROJECTS =====
const getClientProjects = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const clientId = req.userId;
        const offset = (page - 1) * limit;

        let query = `
            SELECT p.id, p.title, p.description, p.budget, p.status, p.progress,
                   p.created_at, s.name as service_name, COUNT(*) OVER() as total
            FROM projects p
            JOIN services s ON p.service_id = s.id
            WHERE p.client_id = ?
        `;

        const params = [clientId];

        if (status) {
            query += ' AND p.status = ?';
            params.push(status);
        }

        query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [projects] = await pool.query(query, params);

        const total = projects.length > 0 ? projects[0].total : 0;

        res.json({
            success: true,
            data: projects,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(total / limit),
                total_items: total
            }
        });

    } catch (error) {
        console.error('Get client projects error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب المشاريع',
            error: error.message
        });
    }
};

// ===== GET PROJECT DETAILS =====
const getProjectDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        // Check authorization
        const [project] = await pool.query(
            `SELECT p.*, s.name as service_name, u.username as client_name, u.email as client_email
             FROM projects p
             JOIN services s ON p.service_id = s.id
             JOIN users u ON p.client_id = u.id
             WHERE p.id = ?`,
            [id]
        );

        if (project.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المشروع غير موجود'
            });
        }

        // Check if user has access
        if (project[0].client_id !== userId && req.userRole !== 'admin' && project[0].assigned_to !== userId) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحيات للوصول لهذا المشروع'
            });
        }

        res.json({
            success: true,
            data: project[0]
        });

    } catch (error) {
        console.error('Get project details error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب تفاصيل المشروع',
            error: error.message
        });
    }
};

// ===== UPDATE PROJECT STATUS =====
const updateProjectStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, progress } = req.body;
        const progressValue = Number.isFinite(Number(progress)) ? Number(progress) : 0;
        const safeProgress = status === 'completed' && progressValue < 100
            ? 100
            : Math.min(Math.max(progressValue, 0), 100);

        const [result] = await pool.query(
            `UPDATE projects SET status = ?, progress = ? WHERE id = ?`,
            [status, safeProgress, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'المشروع غير موجود'
            });
        }

        // Notify client
        const [project] = await pool.query(
            'SELECT client_id FROM projects WHERE id = ?',
            [id]
        );

        if (project.length > 0) {
            await pool.query(
                `INSERT INTO notifications (user_id, type, title, message, related_id)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    project[0].client_id,
                    'project_updated',
                    'تحديث حالة المشروع',
                    `تم تحديث حالة مشروعك إلى: ${status}`,
                    id
                ]
            );
        }

        res.json({
            success: true,
            message: 'تم تحديث المشروع بنجاح'
        });

    } catch (error) {
        console.error('Update project status error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث المشروع',
            error: error.message
        });
    }
};

// ===== GET DASHBOARD STATS =====
const getDashboardStats = async (req, res) => {
    try {
        const clientId = req.userId;

        // Get open projects count
        const [openProjects] = await pool.query(
            `SELECT COUNT(*) as count FROM projects WHERE client_id = ? AND status IN ('pending', 'on_hold')`,
            [clientId]
        );

        // Get active projects count
        const [activeProjects] = await pool.query(
            `SELECT COUNT(*) as count FROM projects WHERE client_id = ? AND status = 'in_progress'`,
            [clientId]
        );

        // Get pending payments count
        const [pendingPayments] = await pool.query(
            `SELECT COUNT(*) as count FROM projects WHERE client_id = ? AND status = 'completed'`,
            [clientId]
        );

        // Get recent projects
        const [recentProjects] = await pool.query(
            `SELECT p.id, p.title, p.description, p.status, p.progress, s.name as service_name
             FROM projects p
             JOIN services s ON p.service_id = s.id
             WHERE p.client_id = ?
             ORDER BY p.created_at DESC
             LIMIT 4`,
            [clientId]
        );

        // Get completion rate this month
        const [completionRate] = await pool.query(
            `SELECT 
                ROUND(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100 / 
                NULLIF(COUNT(*), 0), 0) as rate
             FROM projects 
             WHERE client_id = ? AND MONTH(created_at) = MONTH(NOW())`,
            [clientId]
        );

        // Get total spent
        const [totalSpent] = await pool.query(
            `SELECT COALESCE(SUM(budget), 0) as total FROM projects WHERE client_id = ?`,
            [clientId]
        );

        res.json({
            success: true,
            data: {
                openRequests: openProjects[0].count,
                activeProjects: activeProjects[0].count,
                pendingPayments: pendingPayments[0].count,
                completionRate: completionRate[0].rate || 0,
                totalSpent: totalSpent[0].total,
                recentProjects: recentProjects
            }
        });

    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب إحصائيات لوحة التحكم',
            error: error.message
        });
    }
};

// ✅ تصدير جميع الدوال
module.exports = {
    createProject,
    getClientProjects,
    getProjectDetails,
    updateProjectStatus,
    getDashboardStats
};