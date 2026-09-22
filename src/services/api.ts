import axios from 'axios';
import { mapDashboardSummary, mapTagCurrentValues, type TongQuanDto, type GiaTriHienTaiDto } from './adapters';

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

// Monitoring (Giám sát / Tổng quan) — route thật nằm dưới /api/giam-sat.
// Response backend dùng tên trường tiếng Việt (TongQuanDto/GiaTriHienTaiDto); được
// map sang shape tiếng Anh (DashboardSummary/TagCurrentValue) mà UI đã code sẵn — xem adapters.ts.
export const monitoringApi = {
  getDashboard: () =>
    api.get<TongQuanDto>('/api/giam-sat/tong-quan')
      .then(r => ({ ...r, data: mapDashboardSummary(r.data) })),
  getCurrentValues: (equipmentId: number) =>
    api.get<GiaTriHienTaiDto[]>(`/api/giam-sat/thiet-bi/${equipmentId}/gia-tri-hien-tai`)
      .then(r => ({ ...r, data: mapTagCurrentValues(r.data) })),
  // Gộp Tag của tất cả thiết bị, lọc theo khu vực nếu có — dùng cho tùy chọn "Tất cả thiết bị".
  getAllCurrentValues: (khuVucId?: number) =>
    api.get<GiaTriHienTaiDto[]>('/api/giam-sat/gia-tri-hien-tai', { params: khuVucId ? { khuVucId } : undefined })
      .then(r => ({ ...r, data: mapTagCurrentValues(r.data) })),
  // getTrend/getHistory chưa được nối lại trong đợt này (ngoài phạm vi "giám sát/tổng quan"),
  // trang Trend/History vẫn dùng dữ liệu demo như trước.
  getTrend: (tagIds: number[], from: string, to: string) =>
    api.post('/api/monitoring/trend', { tagIds, from, to }),
  getHistory: (params: Record<string, unknown>) =>
    api.get('/api/monitoring/history', { params }),
};

// Areas (Khu vực)
export const areasApi = {
  getAll: () => api.get('/api/khu-vuc'),
  getById: (id: number) => api.get(`/api/khu-vuc/${id}`),
  create: (data: unknown) => api.post('/api/khu-vuc', data),
  update: (id: number, data: unknown) => api.put(`/api/khu-vuc/${id}`, data),
  delete: (id: number) => api.delete(`/api/khu-vuc/${id}`),
};

// Equipments (Thiết bị)
export const equipmentsApi = {
  getAll: (khuVucId?: number) => api.get('/api/thiet-bi', { params: khuVucId ? { khuVucId } : undefined }),
  getById: (id: number) => api.get(`/api/thiet-bi/${id}`),
  create: (data: unknown) => api.post('/api/thiet-bi', data),
  update: (id: number, data: unknown) => api.put(`/api/thiet-bi/${id}`, data),
  delete: (id: number) => api.delete(`/api/thiet-bi/${id}`),
};

// Tags / Tín hiệu
export const tagsApi = {
  getByEquipment: (thietBiId: number) => api.get('/api/tin-hieu', { params: { thietBiId } }),
  create: (data: unknown) => api.post('/api/tin-hieu', data),
  update: (id: number, data: unknown) => api.put(`/api/tin-hieu/${id}`, data),
  delete: (id: number) => api.delete(`/api/tin-hieu/${id}`),
};

// Import cấu hình từ file
export const importApi = {
  downloadTemplate: () => api.get('/api/import/mau-thiet-bi-tin-hieu', { responseType: 'blob' }),
  uploadThietBiTinHieu: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/import/thiet-bi-tin-hieu', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Maintenance (Bảo dưỡng)
export const maintenanceApi = {
  getAll: (params?: { khuVucId?: number; thietBiId?: number; trangThaiHanChot?: string }) =>
    api.get('/api/bao-duong', { params }),
  getById: (id: number) => api.get(`/api/bao-duong/${id}`),
  create: (data: unknown) => api.post('/api/bao-duong', data),
  update: (id: number, data: unknown) => api.put(`/api/bao-duong/${id}`, data),
  complete: (id: number, data: { NguoiHoanThanh?: string; GhiChu?: string }) =>
    api.post(`/api/bao-duong/${id}/hoan-thanh`, data),
  delete: (id: number) => api.delete(`/api/bao-duong/${id}`),
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
