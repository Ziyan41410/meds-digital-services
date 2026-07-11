/**
 * Client Dashboard Routes
 * /api/client/dashboard
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken, getUserInfo } = require('../middlewares/auth');

// Protected routes - Authenticated clients only
router.use(verifyToken);
router.use(getUserInfo);

// Get client dashboard data including stats and projects
router.get('/', async (req, res) => {
    try {
        const userId = req.userId;

        // Get dashboard stats directly
        const [openProjects] = await pool.query(
            `SELECT COUNT(*) as count FROM projects WHERE client_id = ? AND status IN ('pending', 'on_hold')`,
            [userId]
        );

        const [activeProjects] = await pool.query(
            `SELECT COUNT(*) as count FROM projects WHERE client_id = ? AND status = 'in_progress'`,
            [userId]
        );

        const [completedProjects] = await pool.query(
            `SELECT COUNT(*) as count FROM projects WHERE client_id = ? AND status = 'completed'`,
            [userId]
        );

        const [pendingPayments] = await pool.query(
            `SELECT COUNT(*) as count FROM projects WHERE client_id = ? AND status = 'completed' AND COALESCE(paid, 0) = 0`,
            [userId]
        );

        // Get client projects
        const [projects] = await pool.query(
            `SELECT p.id, p.title, p.description, p.budget, p.status, p.progress, p.domain,
                    p.created_at, p.end_date, s.name as service_name
             FROM projects p
             JOIN services s ON p.service_id = s.id
             WHERE p.client_id = ?
             ORDER BY p.created_at DESC`,
            [userId]
        );

        // Calculate average progress with completed projects normalized to 100%
        const avgProgress = projects.length > 0
            ? Math.round(projects.reduce((sum, p) => {
                const raw = Number.isFinite(Number(p.progress)) ? Number(p.progress) : 0;
                const pct = p.status === 'completed' && raw < 100 ? 100 : Math.min(Math.max(raw, 0), 100);
                return sum + pct;
            }, 0) / projects.length)
            : 0;

        // Return dashboard data in the expected format
        res.json({
            success: true,
            data: {
                stats: {
                    active_projects: activeProjects[0].count,
                    avg_progress: avgProgress,
                    completed_projects: completedProjects[0].count,
                    pending_payments: pendingPayments[0].count
                },
                projects: projects,
                recentActivity: []
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'فشل تحميل بيانات لوحة التحكم',
            error: error.message
        });
    }
});

module.exports = router;