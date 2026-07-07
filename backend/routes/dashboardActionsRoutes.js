/**
 * Dashboard Actions Routes
 * Quick actions: service requests, messages, invoices
 */

const express = require('express');
const router = express.Router();
const dashboardActionsController = require('../controllers/dashboardActionsController');
const { verifyToken } = require('../middlewares/auth');

// All routes require authentication
router.use(verifyToken);

// Service requests
router.post(
    '/service-request',
    dashboardActionsController.createServiceRequest
);

// Messages
router.post(
    '/message',
    dashboardActionsController.sendMessageToTeam
);

router.get(
    '/messages/:projectId',
    dashboardActionsController.getProjectMessages
);

// Invoices/Billing
router.get(
    '/invoices',
    dashboardActionsController.getInvoices
);

// Available services
router.get(
    '/services',
    dashboardActionsController.getAvailableServices
);

module.exports = router;
