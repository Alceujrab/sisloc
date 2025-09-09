import axios from 'axios';

// Configuração base da API
// Em produção, defina VITE_API_URL (ex.: https://seu-backend.onrender.com/api)
const baseURL = import.meta?.env?.VITE_API_URL || '/api';
export const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptador de requisição
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptador de resposta
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Token expirado ou inválido
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      
      // Redirecionar para login apenas se não estiver na página de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Serviços de API

// Autenticação
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  verifyEmail: (token) => api.get('/auth/verify-email', { params: { token } }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email })
};

// Veículos
export const vehicleService = {
  getAll: (params) => api.get('/vehicles', { params }),
  getById: (id) => api.get(`/vehicles/${id}`),
  getFeatured: (limit = 8) => api.get('/vehicles/featured', { params: { limit } }),
  getCategories: () => api.get('/vehicles/categories'),
  getBrands: () => api.get('/vehicles/brands'),
  checkAvailability: (id, params) => api.get(`/vehicles/${id}/availability`, { params }),
};

// Reservas
export const reservationService = {
  create: (reservationData) => api.post('/reservations', reservationData),
  getAll: (params) => api.get('/reservations', { params }),
  getById: (id) => api.get(`/reservations/${id}`),
  cancel: (id) => api.put(`/reservations/${id}/cancel`),
  addReview: (id, reviewData) => api.post(`/reservations/${id}/review`, reviewData),
  extend: (id, { new_end_date }) => api.patch(`/reservations/${id}/extend`, { new_end_date })
};

// Pagamentos
export const paymentService = {
  createPaymentIntent: (paymentData) => api.post('/payments/create-payment-intent', paymentData),
  confirmPayment: (paymentData) => api.post('/payments/confirm-payment', paymentData),
  getHistory: (params) => api.get('/payments/history', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  createManual: (data) => api.post('/payments/manual', data),
  uploadReceipt: (paymentId, file) => {
    const fd = new FormData();
    fd.append('receipt', file);
    return api.post(`/payments/${paymentId}/receipt`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// Conteúdo Público (banners e contato)
export const publicService = {
  getBanners: () => api.get('/public/banners'),
  getContactInfo: () => api.get('/public/contact'),
  getLocations: () => api.get('/public/locations'),
  getOffers: () => api.get('/public/offers'),
  getGroups: () => api.get('/public/groups'),
  validateCoupon: (code) => api.post('/public/validate-coupon', { code }),
  createBusinessLead: (data) => api.post('/public/business-lead', data),
  getGroupMinimums: () => api.get('/public/group-minimums')
};

// Portal do Cliente
export const customerPortalService = {
  getDashboard: () => api.get('/customers/dashboard'),
  getDocuments: () => api.get('/customers/documents'),
  uploadDocument: (type, file) => {
    const fd = new FormData();
    fd.append('type', type);
    fd.append('file', file);
    return api.post('/customers/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getContractPdfUrl: (reservationId) => `/api/customers/reservations/${reservationId}/contract`,
  uploadAvatar: (file) => {
    const fd = new FormData();
    fd.append('avatar', file);
    return api.post('/customers/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadSignature: (reservationId, file) => {
    const fd = new FormData();
    fd.append('signature', file);
    return api.post(`/customers/reservations/${reservationId}/signature`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  deleteSignature: (reservationId) => api.delete(`/customers/reservations/${reservationId}/signature`),
  acceptContract: (reservationId) => api.post(`/customers/reservations/${reservationId}/accept-contract`),
  getLoyalty: () => api.get('/customers/loyalty'),
  redeemLoyalty: (points, reason) => api.post('/customers/loyalty/redeem', { points, reason }),
  createRefund: (data) => api.post('/customers/refunds', data),
  getRefunds: (params) => api.get('/customers/refunds', { params })
};

// Upload de arquivos
export const uploadService = {
  uploadImage: (file, folder = 'general') => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);
    
    return api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Utilitários para formatação
export const formatters = {
  currency: (value, currency = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(value);
  },
  
  date: (date, options = {}) => {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    };
    
    return new Intl.DateTimeFormat('pt-BR', defaultOptions).format(new Date(date));
  },
  
  dateTime: (date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  },
  
  phone: (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
    
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    
    return phone;
  },
  
  cpf: (cpf) => {
    const cleaned = cpf.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
    
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
    }
    
    return cpf;
  },
};

// Validadores
export const validators = {
  email: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },
  
  phone: (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 || cleaned.length === 11;
  },
  
  cpf: (cpf) => {
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.length === 11;
  },
  
  password: (password) => {
    // Pelo menos 6 caracteres, uma maiúscula, uma minúscula e um número
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/;
    return re.test(password);
  },
};

export default api;
