import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true
});

// Anexar token (se houver)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
 
 export const adminService = {
   login: (data) => api.post('/auth/login', data),
   register: (data) => api.post('/auth/register', data),
   forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
   resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
   me: () => api.get('/auth/me'),
   // ... existentes
   getLocations: () => api.get('/admin/locations'),
   createLocation: (payload) => api.post('/admin/locations', payload),
   updateLocation: (id, payload) => api.put(`/admin/locations/${id}`, payload),
   deleteLocation: (id) => api.delete(`/admin/locations/${id}`),
   getCoupons: () => api.get('/admin/coupons'),
   createCoupon: (payload) => api.post('/admin/coupons', payload),
   updateCoupon: (id, payload) => api.put(`/admin/coupons/${id}`, payload),
   deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`),
  // price rules
  getPriceRules: (params={}) => api.get('/admin/price-rules', { params }),
  createPriceRule: (payload) => api.post('/admin/price-rules', payload),
  updatePriceRule: (id, payload) => api.put(`/admin/price-rules/${id}`, payload),
  deletePriceRule: (id) => api.delete(`/admin/price-rules/${id}`),
  // documentos
  getDocuments: (params={}) => api.get('/admin/documents', { params }),
  updateDocumentStatus: (id, payload) => api.put(`/admin/documents/${id}/status`, payload),
   // avatar do cliente
   uploadCustomerAvatar: (id, file) => {
     const fd = new FormData();
     fd.append('avatar', file);
     return api.post(`/admin/customers/${id}/avatar`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
   },
  removeCustomerAvatar: (id) => api.delete(`/admin/customers/${id}/avatar`),
  getCustomer: (id) => api.get(`/admin/customers/${id}`),
  updateCustomer: (id, payload) => api.put(`/admin/customers/${id}`, payload),
  // grupos
  getGroups: () => api.get('/admin/groups'),
  createGroup: (payload) => api.post('/admin/groups', payload),
  updateGroup: (id, payload) => api.put(`/admin/groups/${id}`, payload),
  deleteGroup: (id) => api.delete(`/admin/groups/${id}`),
  uploadGroupImage: (id, file) => {
    const fd = new FormData();
    fd.append('image', file);
    return api.post(`/admin/groups/${id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  // dashboard
  getDashboard: (params={}) => api.get('/admin/dashboard', { params }),
  // refunds
  getRefunds: (params={}) => api.get('/admin/refunds', { params }),
  getRefundById: (id) => api.get(`/admin/refunds/${id}`),
  updateRefundStatus: (id, payload) => api.patch(`/admin/refunds/${id}/status`, payload),
  // relatórios
  getUtilization: (params={}) => api.get('/admin/reports/utilization', { params }),
 };

export default api;
