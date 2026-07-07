/**
 * API Helper Functions
 * Client-side API communication
 */

const API_BASE_URL = window.location.protocol.startsWith('http') && window.location.port === '3001'
    ? '/api'
    : 'http://localhost:3001/api';

/**
 * Make API Request
 * @param {string} endpoint - API endpoint path
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {object} data - Request body data
 * @param {string} token - JWT token for auth
 */
async function apiRequest(endpoint, method = 'GET', data = null, token = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers.Authorization = `Bearer ${token}`;
        }

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Authentication APIs
 */
const authAPI = {
    register: (data) => apiRequest('/auth/register', 'POST', data),
    login: (email, password) => apiRequest('/auth/login', 'POST', { email, password }),
    logout: (token) => apiRequest('/auth/logout', 'POST', {}, token),
    getCurrentUser: (token) => apiRequest('/auth/me', 'GET', null, token),
    verifyEmail: (token) => apiRequest(`/auth/verify-email/${token}`),
    forgotPassword: (email) => apiRequest('/auth/forgot-password', 'POST', { email }),
    resetPassword: (token, password) => 
        apiRequest('/auth/reset-password', 'POST', { token, password }),
};

/**
 * Services APIs
 */
const servicesAPI = {
    getAll: (categoryId = null, page = 1, limit = 10) => {
        let url = `/services?page=${page}&limit=${limit}`;
        if (categoryId) url += `&category_id=${categoryId}`;
        return apiRequest(url);
    },
    getCategories: () => apiRequest('/services/categories'),
    getById: (id) => apiRequest(`/services/${id}`),
    create: (data, token) => apiRequest('/services', 'POST', data, token),
    update: (id, data, token) => apiRequest(`/services/${id}`, 'PUT', data, token),
    delete: (id, token) => apiRequest(`/services/${id}`, 'DELETE', null, token),
};

/**
 * Projects APIs
 */
const projectsAPI = {
    create: (data, token) => apiRequest('/projects', 'POST', data, token),
    getClientProjects: (status = null, page = 1, limit = 10, token) => {
        let url = `/projects/client/list?page=${page}&limit=${limit}`;
        if (status) url += `&status=${status}`;
        return apiRequest(url, 'GET', null, token);
    },
    getDetails: (id, token) => apiRequest(`/projects/${id}`, 'GET', null, token),
    updateStatus: (id, status, progress, token) =>
        apiRequest(`/projects/${id}/status`, 'PUT', { status, progress }, token),
    getDashboardStats: (token) => apiRequest('/projects/stats/dashboard', 'GET', null, token),
};

/**
 * Reviews APIs
 */
const reviewsAPI = {
    getFeatured: () => apiRequest('/reviews/featured'),
    getProfessionalReviews: (id, page = 1, limit = 10) =>
        apiRequest(`/reviews/professional/${id}?page=${page}&limit=${limit}`),
    create: (data, token) => apiRequest('/reviews', 'POST', data, token),
    delete: (id, token) => apiRequest(`/reviews/${id}`, 'DELETE', null, token),
};

/**
 * Local Storage Helpers
 */
const storage = {
    setToken: (token) => sessionStorage.setItem('token', token),
    getToken: () => sessionStorage.getItem('token') || localStorage.getItem('token'),
    removeToken: () => { sessionStorage.removeItem('token'); localStorage.removeItem('token'); },

    setUser: (user) => sessionStorage.setItem('user', JSON.stringify(user)),
    getUser: () => {
        const user = sessionStorage.getItem('user') || localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    removeUser: () => { sessionStorage.removeItem('user'); localStorage.removeItem('user'); },

    isLoggedIn: () => !!(sessionStorage.getItem('token') || localStorage.getItem('token')),
};

/**
 * Notification Helper
 */
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, duration);
}

/**
 * Form Validation
 */
const validation = {
    email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    phone: (phone) => /^[\d\s\-\+\(\)]{10,}$/.test(phone),
    password: (password) => password.length >= 6,
    username: (username) => username.length >= 3,
    url: (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
};

export { apiRequest, authAPI, servicesAPI, projectsAPI, reviewsAPI, storage, showNotification, validation };
