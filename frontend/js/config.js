/**
 * Global Configuration
 * Handles API endpoints and server settings
 */

// Detect if running from a browser and choose API base dynamically,
// fallback to the common dev port 3001 when not served over HTTP(S).
const getAPIBase = () => {
  if (typeof window !== 'undefined' && window.location && window.location.protocol && window.location.protocol.startsWith('http')) {
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    return `${protocol}//${host}${port}/api`;
  }
  return 'http://localhost:3001/api';
};

const getSocketURL = () => {
  // استخدم نفس host و protocol مثل الصفحة الحالية
  if (typeof window !== 'undefined' && window.location && window.location.protocol && window.location.protocol.startsWith('http')) {
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    return `${protocol}//${host}${port}`;
  }
  return 'http://localhost:3001'; // fallback فقط للتطوير المحلي
};

// Global API configuration
const API_CONFIG = {
  BASE: getAPIBase(),
  SOCKET_URL: getSocketURL(),
  
  // API Routes
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password'
  },
  
  SERVICES: {
    LIST: '/services',
    CATEGORIES: '/services/categories',
    DETAIL: (id) => `/services/${id}`,
    CREATE: '/services',
    UPDATE: (id) => `/services/${id}`,
    DELETE: (id) => `/services/${id}`
  },
  
  PROJECTS: {
    LIST: '/projects/client/list',
    CREATE: '/projects',
    DETAIL: (id) => `/projects/${id}`,
    UPDATE_STATUS: (id) => `/projects/${id}/status`,
    DASHBOARD_STATS: '/projects/stats/dashboard'
  },
  
  MANAGER: {
    ME: '/manager/me',
    DASHBOARD: '/manager/dashboard',
    ORDERS: '/manager/orders',
    ORDER_DETAIL: (id) => `/manager/orders/${id}`,
    UPDATE_ORDER: (id) => `/manager/orders/${id}`
  },
  
  REVIEWS: {
    LIST: '/reviews',
    FEATURED: '/reviews/featured',
    CREATE: '/reviews',
    DELETE: (id) => `/reviews/${id}`
  },
  
  CHAT: {
    SEND: '/chat/send',
    GET_MESSAGES: (roomId) => `/chat/messages/${roomId}`,
    GET_CONVERSATIONS: '/chat/conversations'
  },
  
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: '/notifications/mark-read'
  }
};

// Helper function to build full API URL
const buildAPIUrl = (endpoint) => {
  if (endpoint.startsWith('/')) {
    return API_CONFIG.BASE + endpoint;
  }
  return API_CONFIG.BASE + '/' + endpoint;
};

// Export for use in modules (if using ES6)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_CONFIG, buildAPIUrl };
}
