/**
 * Response Formatter Utilities
 */

/**
 * Send success response
 */
const sendSuccess = (res, data = null, message = 'تم بنجاح', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Send error response
 */
const sendError = (res, message = 'حدث خطأ', statusCode = 400, error = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error : null,
    timestamp: new Date().toISOString()
  });
};

/**
 * Send paginated response
 */
const sendPaginated = (res, data, page, limit, total, message = 'تم بنجاح') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendPaginated
};
