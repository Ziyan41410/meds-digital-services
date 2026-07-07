/**
 * Services Routes
 * /api/services
 */

const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/servicesController');
const { verifyToken, checkRole } = require('../middlewares/auth');
const { validateServiceCreation, handleValidationErrors } = require('../middlewares/validation');

// Public routes
router.get('/', servicesController.getAllServices);
router.get('/categories', servicesController.getCategories);
router.get('/:id', servicesController.getServiceById);

// Protected routes - Admin only
router.post(
    '/',
    verifyToken,
    checkRole(['admin']),
    validateServiceCreation,
    handleValidationErrors,
    servicesController.createService
);

router.put(
    '/:id',
    verifyToken,
    checkRole(['admin']),
    servicesController.updateService
);

router.delete(
    '/:id',
    verifyToken,
    checkRole(['admin']),
    servicesController.deleteService
);

module.exports = router;
