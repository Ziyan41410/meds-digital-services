/**
 * Error Handling Middleware
 * Centralized error handling
 */

// Global Error Handler
exports.errorHandler = (error, req, res, next) => {
    console.error('Error:', error);

    // Validation Error
    if (error.status === 400 || error.message.includes('validation')) {
        return res.status(400).json({
            success: false,
            message: error.message || 'بيانات غير صحيحة',
            errors: error.errors
        });
    }

    // Authentication Error
    if (error.status === 401 || error.message.includes('unauthorized')) {
        return res.status(401).json({
            success: false,
            message: 'غير مصرح'
        });
    }

    // Authorization Error
    if (error.status === 403 || error.message.includes('forbidden')) {
        return res.status(403).json({
            success: false,
            message: 'ليس لديك صلاحيات كافية'
        });
    }

    // Not Found
    if (error.status === 404 || error.message.includes('not found')) {
        return res.status(404).json({
            success: false,
            message: 'المورد غير موجود'
        });
    }

    // Database Error
    if (error.code && error.code.startsWith('ER_')) {
        return res.status(500).json({
            success: false,
            message: 'خطأ في قاعدة البيانات'
        });
    }

    // Server Error (default)
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'خطأ في الخادم',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
};

// Not Found Handler
exports.notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: 'المسار غير موجود'
    });
};

// Async Handler - Wrap async route handlers to catch errors
exports.asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
