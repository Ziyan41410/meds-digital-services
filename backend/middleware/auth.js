const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ success: false, error: 'الرجاء تسجيل الدخول' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || !user.is_active) {
            return res.status(401).json({ success: false, error: 'الجلسة غير صالحة' });
        }

        req.user = user;
        next();
    } catch (e) {
        res.status(401).json({ success: false, error: 'الرجاء تسجيل الدخول مرة أخرى' });
    }
};

exports.roleMiddleware = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role_name)) {
        return res.status(403).json({ success: false, error: 'غير مصرح لك بتنفيذ هذا الإجراء' });
    }

    next();
};
