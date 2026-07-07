const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: 'المسار المطلوب غير موجود',
    });
};

const errorHandler = (err, req, res, next) => {
    const status = err.status || err.statusCode || 500;

    console.error(err.stack || err.message);

    res.status(status).json({
        success: false,
        error: status === 500 ? 'حدث خطأ داخلي في الخادم' : err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

module.exports = { errorHandler, notFoundHandler };
