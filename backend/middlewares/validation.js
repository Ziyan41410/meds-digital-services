/**
 * Validation & Security Middleware
 */

const { body, validationResult, param, query } = require('express-validator');

// Middleware to handle validation errors
exports.handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'بيانات غير صحيحة',
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    }
    next();
};

// ===== Auth Validation =====
exports.validateRegister = [
    body('first_name').trim().notEmpty().withMessage('الاسم الأول مطلوب'),
    body('last_name').trim().notEmpty().withMessage('الاسم الأخير مطلوب'),
    body('username').trim().isLength({ min: 3 }).withMessage('اسم المستخدم يجب أن يكون 3 أحرف على الأقل'),
    body('email').isEmail().withMessage('بريد إلكتروني غير صحيح'),
    body('phone').optional().isMobilePhone().withMessage('رقم هاتف غير صحيح'),
    body('password').isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    body('password_confirm').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('كلمات المرور غير متطابقة');
        }
        return true;
    })
];

exports.validateLogin = [
    body('email').isEmail().withMessage('بريد إلكتروني غير صحيح'),
    body('password').notEmpty().withMessage('كلمة المرور مطلوبة')
];

exports.validatePasswordReset = [
    body('email').isEmail().withMessage('بريد إلكتروني غير صحيح')
];

exports.validatePasswordChange = [
    body('old_password').notEmpty().withMessage('كلمة المرور القديمة مطلوبة'),
    body('new_password').isLength({ min: 6 }).withMessage('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'),
    body('new_password_confirm').custom((value, { req }) => {
        if (value !== req.body.new_password) {
            throw new Error('كلمات المرور غير متطابقة');
        }
        return true;
    })
];

// ===== Project Validation =====
exports.validateProjectCreation = [
    body('service_id').isInt().withMessage('معرف الخدمة غير صحيح'),
    body('title').trim().notEmpty().withMessage('عنوان المشروع مطلوب'),
    body('description').trim().notEmpty().withMessage('وصف المشروع مطلوب'),
    body('budget').isFloat({ min: 0 }).withMessage('الميزانية يجب أن تكون رقماً موجباً'),
    body('timeline_days').isInt({ min: 1 }).withMessage('مدة التنفيذ يجب أن تكون رقماً موجباً')
];

// ===== Review Validation =====
exports.validateReview = [
    body('project_id').isInt().withMessage('معرف المشروع غير صحيح'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('التقييم يجب أن يكون بين 1 و 5'),
    body('comment').trim().isLength({ min: 10 }).withMessage('التعليق يجب أن يكون 10 أحرف على الأقل')
];

// ===== Payment Validation =====
exports.validatePayment = [
    body('project_id').isInt().withMessage('معرف المشروع غير صحيح'),
    body('amount').isFloat({ min: 0.01 }).withMessage('المبلغ غير صحيح'),
    body('payment_method').isIn(['stripe', 'paypal', 'bank_transfer']).withMessage('طريقة الدفع غير صحيحة')
];

// ===== Message Validation =====
exports.validateMessage = [
    body('receiver_id').isInt().withMessage('معرف المستقبل غير صحيح'),
    body('message').trim().notEmpty().withMessage('الرسالة مطلوبة'),
    body('message').isLength({ max: 5000 }).withMessage('الرسالة طويلة جداً')
];

// ===== Service Validation =====
exports.validateServiceCreation = [
    body('name').trim().notEmpty().withMessage('اسم الخدمة مطلوب'),
    body('category_id').isInt().withMessage('معرف الفئة غير صحيح'),
    body('description').trim().notEmpty().withMessage('وصف الخدمة مطلوب'),
    body('price').isFloat({ min: 0 }).withMessage('السعر يجب أن يكون رقماً موجباً')
];

// ===== User Profile Update =====
exports.validateProfileUpdate = [
    body('first_name').optional().trim().notEmpty().withMessage('الاسم الأول مطلوب'),
    body('last_name').optional().trim().notEmpty().withMessage('الاسم الأخير مطلوب'),
    body('bio').optional().trim().isLength({ max: 500 }).withMessage('النبذة طويلة جداً')
];
