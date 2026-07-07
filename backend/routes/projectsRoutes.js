/**
 * Projects Routes
 * /api/projects
 */

const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projectsController');
const { verifyToken, getUserInfo, checkRole } = require('../middlewares/auth');
const { validateProjectCreation, handleValidationErrors } = require('../middlewares/validation');

// Protected routes - Authenticated users only
router.post(
    '/',
    verifyToken,
    getUserInfo,
    validateProjectCreation,
    handleValidationErrors,
    projectsController.createProject
);

router.get(
    '/client/list',
    verifyToken,
    projectsController.getClientProjects
);

router.get(
    '/stats/dashboard',
    verifyToken,
    projectsController.getDashboardStats
);

router.get(
    '/:id',
    verifyToken,
    projectsController.getProjectDetails
);

router.put(
    '/:id/status',
    verifyToken,
    checkRole(['admin', 'programmer', 'marketer', 'cyber_security_expert']),
    projectsController.updateProjectStatus
);

module.exports = router;
