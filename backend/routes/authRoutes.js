const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/register', [
    body('first_name').trim().isLength({ min: 2 }).withMessage('الاسم الأول مطلوب'),
    body('last_name').trim().isLength({ min: 2 }).withMessage('الاسم العائلي مطلوب'),
    body('username').trim().isLength({ min: 3 }).withMessage('اسم المستخدم يجب أن يكون 3 أحرف على الأقل'),
    body('email').isEmail().normalizeEmail().withMessage('البريد الإلكتروني غير صالح'),
    body('phone').trim().isLength({ min: 6 }).withMessage('رقم الهاتف غير صالح'),
    body('password').isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
], authController.register);

router.post('/login', [
    body('identifier').trim().notEmpty().withMessage('البريد أو اسم المستخدم أو الهاتف مطلوب'),
    body('password').notEmpty().withMessage('كلمة المرور مطلوبة'),
], authController.login);

router.get('/verify/:token', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/me', authMiddleware, authController.getProfile);
router.get('/profile', authMiddleware, authController.getProfile);
router.patch('/profile', authMiddleware, authController.updateProfile);
router.post('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
