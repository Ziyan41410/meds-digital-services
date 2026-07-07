/**
 * Client Dashboard Routes - Mock Version
 * /api/client/dashboard
 * This version works without database connection
 */

const express = require('express');
const router = express.Router();

// Mock data for testing
const mockProjects = [
    {
        id: 1,
        title: 'تطوير موقع ويب للشركة',
        description: 'تطوير موقع ويب احترافي للشركة',
        budget: 5000,
        status: 'in_progress',
        progress: 65,
        domain: 'dev',
        created_at: '2023-01-15',
        end_date: '2023-03-15',
        service_name: 'تطوير مواقع ويب'
    },
    {
        id: 2,
        title: 'حملة تسويق على وسائل التواصل الاجتماعي',
        description: 'إدارة حملة تسويق على وسائل التواصل الاجتماعي',
        budget: 3000,
        status: 'pending',
        progress: 0,
        domain: 'mkt',
        created_at: '2023-02-01',
        end_date: '2023-04-01',
        service_name: 'إدارة السوشيال ميديا'
    },
    {
        id: 3,
        title: 'تدقيق أمان للشبكة',
        description: 'تدقيق أمان شامل للشبكة الداخلية',
        budget: 8000,
        status: 'completed',
        progress: 100,
        domain: 'sec',
        created_at: '2022-12-10',
        end_date: '2023-01-10',
        service_name: 'تدقيق الأمان'
    }
];

// Protected routes - Authenticated clients only
router.use((req, res, next) => {
    // Mock authentication - in real app, use verifyToken middleware
    if (!req.headers.authorization) {
        return res.status(401).json({
            success: false,
            message: 'Token غير موجود'
        });
    }
    next();
});

// Get client dashboard data including stats and projects
router.get('/', async (req, res) => {
    try {
        // Mock user ID
        const userId = 1;

        // Calculate stats from mock data
        const activeProjectsCount = mockProjects.filter(p => p.status === 'in_progress').length;
        const completedProjectsCount = mockProjects.filter(p => p.status === 'completed').length;
        const avgProgress = Math.round(mockProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / mockProjects.length);
        const pendingPaymentsCount = mockProjects.filter(p => p.status === 'completed').length;

        // Return dashboard data in the expected format
        res.json({
            success: true,
            data: {
                stats: {
                    active_projects: activeProjectsCount,
                    avg_progress: avgProgress,
                    completed_projects: completedProjectsCount,
                    pending_payments: pendingPaymentsCount
                },
                projects: mockProjects,
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