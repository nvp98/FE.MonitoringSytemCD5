import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    console.error('API Error:', err.response?.data || err.message);
    return Promise.reject(err);
  }
);

// Monitoring
export const monitoringApi = {
  getDashboard: () => api.get('/api/monitoring/dashboard'),
  getCurrentValues: (equipmentId: number) => api.get(`/api/monitoring/equipment/${equipmentId}/current`),
  getTrend: (tagIds: number[], from: string, to: string) =>
    api.post('/api/monitoring/trend', { tagIds, from, to }),
  getHistory: (params: Record<string, unknown>) =>
    api.get('/api/monitoring/history', { params }),
};

// Areas
export const areasApi = {
  getAll: () => api.get('/api/areas'),
  getById: (id: number) => api.get(`/api/areas/${id}`),
  create: (data: unknown) => api.post('/api/areas', data),
  update: (id: number, data: unknown) => api.put(`/api/areas/${id}`, data),
  delete: (id: number) => api.delete(`/api/areas/${id}`),
};

// Equipments
export const equipmentsApi = {
  getAll: (areaId?: number) => api.get('/api/equipments', { params: { areaId } }),
  getById: (id: number) => api.get(`/api/equipments/${id}`),
  create: (data: unknown) => api.post('/api/equipments', data),
  update: (id: number, data: unknown) => api.put(`/api/equipments/${id}`, data),
  delete: (id: number) => api.delete(`/api/equipments/${id}`),
};

// Tags
export const tagsApi = {
  getByEquipment: (equipmentId: number) => api.get('/api/tags', { params: { equipmentId } }),
  create: (data: unknown) => api.post('/api/tags', data),
  update: (id: number, data: unknown) => api.put(`/api/tags/${id}`, data),
  updateThreshold: (id: number, data: unknown) => api.put(`/api/tags/${id}/threshold`, data),
  delete: (id: number) => api.delete(`/api/tags/${id}`),
};

// Maintenance
export const maintenanceApi = {
  getAll: (params?: { areaId?: number; equipmentId?: number; dueStatus?: string }) =>
    api.get('/api/maintenance', { params }),
  getById: (id: number) => api.get(`/api/maintenance/${id}`),
  create: (data: unknown) => api.post('/api/maintenance', data),
  update: (id: number, data: unknown) => api.put(`/api/maintenance/${id}`, data),
  complete: (id: number, data: { completedBy?: string; note?: string }) =>
    api.post(`/api/maintenance/${id}/complete`, data),
  delete: (id: number) => api.delete(`/api/maintenance/${id}`),
};

// Alarms
export const alarmsApi = {
  getActive: () => api.get('/api/alarms/active'),
  getHistory: (params: Record<string, unknown>) => api.get('/api/alarms/history', { params }),
  acknowledge: (id: number, data: { acknowledgedBy: string; note?: string }) =>
    api.post(`/api/alarms/${id}/acknowledge`, data),
  clear: (id: number, clearedBy: string) =>
    api.post(`/api/alarms/${id}/clear`, null, { params: { clearedBy } }),
};
