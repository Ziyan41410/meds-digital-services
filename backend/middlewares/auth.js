/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes
 */

const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Verify JWT Token
exports.verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token غير موجود'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [rows] = await pool.query('SELECT is_active FROM users WHERE id = ?', [decoded.id]);
        if (!rows.length || rows[0].is_active !== 1) {
            return res.status(401).json({
                success: false,
                message: 'الحساب غير مفعل أو معطل'
            });
        }

        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token غير صالح أو منتهي الصلاحية'
        });
    }
};

// Check User Role
exports.checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.userRole)) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحيات كافية للوصول لهذا المورد'
            });
        }
        next();
    };
};

// Optional Token (for public routes with optional auth)
exports.optionalToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = decoded.id;
            req.userRole = decoded.role;
        }
        next();
    } catch (error) {
        // Token invalid but optional, continue anyway
        next();
    }
};

// Get User Info (helper for authenticated requests)
exports.getUserInfo = async (req, res, next) => {
    try {
        const [user] = await pool.query(
            `SELECT id, username, email, first_name, last_name, role_id, profile_image 
             FROM users WHERE id = ?`,
            [req.userId]
        );
        
        if (user.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }
        
        req.user = user[0];
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم',
            error: error.message
        });
    }
};
