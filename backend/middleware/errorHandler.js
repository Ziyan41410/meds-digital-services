const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: 'المسار المطلوب غير موجود',
    });
};

const errorHandler = (err, req, res, next) => {
    const status = err.status || err.statusCode || 500;

    console.error(err.stack || err.message || err);

    const showDetails = process.env.SHOW_ERROR_DETAILS === 'true' || process.env.NODE_ENV === 'development';

    const body = {
        success: false,
        error: (!showDetails && status === 500) ? 'حدث خطأ داخلي في الخادم' : (err.message || 'خطأ'),
    };

    if (showDetails) {
        body.details = err.stack || String(err);
    }

    res.status(status).json(body);
};

module.exports = { errorHandler, notFoundHandler };
