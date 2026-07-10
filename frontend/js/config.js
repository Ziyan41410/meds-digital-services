/**
 * Global Configuration
 * Handles API endpoints and server settings
 */

// Detect environment: production or development
const isProduction = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
};

// Detect if running from a browser and choose API base dynamically
const getAPIBase = () => {
  if (typeof window !== 'undefined' && window.location && window.location.protocol && window.location.protocol.startsWith('http')) {
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    const apiBase = `${protocol}//${host}${port}/api`;
    console.log('✅ API Base URL:', apiBase);
    return apiBase;
  }
  return 'http://localhost:3001/api';
};

// Get Socket.io URL - CRITICAL FOR PRODUCTION
const getSocketURL = () => {
  if (typeof window !== 'undefined' && window.location && window.location.protocol && window.location.protocol.startsWith('http')) {
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    const socketUrl = `${protocol}//${host}${port}`;
    console.log('✅ Socket.io URL:', socketUrl);
    return socketUrl;
  }
  return 'http://localhost:3001';
};

// Helper function to get token
const getAuthToken = () => {
  try {
    return localStorage.getItem('token') || '';
  } catch (e) {
    console.warn('⚠️ Failed to get token from localStorage');
    return '';
  }
};

// Global API configuration
const API_CONFIG = {
  BASE: getAPIBase(),
  SOCKET_URL: getSocketURL(),
  IS_PRODUCTION: isProduction(),
  
  SOCKET_OPTIONS: {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
    transports: ['websocket', 'polling'],
    withCredentials: true,
    upgrade: true,
    rememberUpgrade: true,
    autoConnect: true,
    forceNew: false,
    query: {
      token: getAuthToken()
    }
  },

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

// Utility function to create fetch options with auth header
const getFetchOptions = (method = 'GET', data = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    credentials: 'include'
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  return options;
};

// Export for use in modules (if using ES6)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_CONFIG, buildAPIUrl, getFetchOptions, getAuthToken };
}
