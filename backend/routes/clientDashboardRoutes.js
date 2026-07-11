/**
 * Client Dashboard Routes - Real MySQL Data
 * /api/client/dashboard
 */
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken, getUserInfo } = require('../middlewares/auth');

router.use(verifyToken);
router.use(getUserInfo);

router.get('/', async (req, res) => {
    try {
        const clientId = req.userId;
        console.log('[Dashboard] Loading data for client ID:', clientId);

        const [statsRows] = await pool.query(
            `SELECT
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS active_projects,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_projects,
                SUM(CASE WHEN status = 'completed' AND COALESCE(paid, 0) = 0 THEN 1 ELSE 0 END) AS pending_payments,
                ROUND(AVG(
                    CASE
                        WHEN status = 'completed' THEN 100
                        WHEN COALESCE(progress, 0) < 0 THEN 0
                        WHEN COALESCE(progress, 0) > 100 THEN 100
                        ELSE COALESCE(progress, 0)
                    END
                ), 0) AS avg_progress
             FROM projects
             WHERE client_id = ?`,
            [clientId]
        );

        const [projects] = await pool.query(
            `SELECT
                p.id,
                p.title,
                p.description,
                p.form_data,
                p.budget,
                p.budget_range,
                p.status,
                COALESCE(p.progress, 0) AS progress,
                p.domain,
                p.attachments,
                p.created_at,
                p.end_date,
                s.name AS service_name
             FROM projects p
             LEFT JOIN services s ON p.service_id = s.id
             WHERE p.client_id = ?
             ORDER BY p.created_at DESC`,
            [clientId]
        );

        const stats = statsRows[0] || {};
        const avgProgress = Number.isFinite(Number(stats.avg_progress)) ? Number(stats.avg_progress) : 0;

        res.json({
            success: true,
            data: {
                stats: {
                    active_projects: Number(stats.active_projects || 0),
                    avg_progress: avgProgress,
                    completed_projects: Number(stats.completed_projects || 0),
                    pending_payments: Number(stats.pending_payments || 0)
                },
                projects,
                recentActivity: []
            }
        });
    } catch (error) {
        console.error('[Dashboard] Error:', error);
        res.status(500).json({
            success: false,
            message: 'فشل تحميل بيانات لوحة التحكم',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;
