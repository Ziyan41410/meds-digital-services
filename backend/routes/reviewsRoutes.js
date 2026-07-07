/**
 * Reviews Routes
 * /api/reviews
 */

const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviewsController');
const { verifyToken, checkRole } = require('../middlewares/auth');
const { validateReview, handleValidationErrors } = require('../middlewares/validation');

// Public routes
router.get('/featured', reviewsController.getFeaturedReviews);
router.get('/professional/:id', reviewsController.getProfessionalReviews);

// Protected routes
router.post(
    '/',
    verifyToken,
    validateReview,
    handleValidationErrors,
    reviewsController.createReview
);

// Admin only
router.delete(
    '/:id',
    verifyToken,
    checkRole(['admin']),
    reviewsController.deleteReview
);

module.exports = router;
