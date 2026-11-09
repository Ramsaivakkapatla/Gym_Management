import axios from 'axios';

// Use relative /api which Vite proxies directly to http://127.0.0.1:5000/api
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token to every request if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gym_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthorized 401s gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('gym_admin_token');
      localStorage.removeItem('gym_admin_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API Service Call Methods
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
};

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
};

export const memberService = {
  getAll: (params = {}) => api.get('/members', { params }),
  getById: (id) => api.get(`/members/${id}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  toggleStatus: (id) => api.delete(`/members/${id}`),
};

export const planService = {
  getAll: (params = {}) => api.get('/plans', { params }),
  create: (data) => api.post('/plans', data),
  update: (id, data) => api.put(`/plans/${id}`, data),
  toggleStatus: (id) => api.patch(`/plans/${id}/status`),
};

export const membershipService = {
  getAll: () => api.get('/memberships'),
  getActive: () => api.get('/memberships/status/active'),
  getExpired: () => api.get('/memberships/status/expired'),
  getByMember: (memberId) => api.get(`/memberships/member/${memberId}`),
  assign: (data) => api.post('/memberships', data),
};

export const renewalService = {
  getAll: () => api.get('/renewals'),
  getByMember: (memberId) => api.get(`/renewals/member/${memberId}`),
  renew: (data) => api.post('/renewals', data),
};

export default api;
