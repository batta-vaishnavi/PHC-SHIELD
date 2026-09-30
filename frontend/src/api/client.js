import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const apiClient = {
  // Stats
  getDashboardStats: () => api.get('/dashboard/stats').then(res => res.data),

  // PHCs
  getPhcs: (params) => api.get('/phcs', { params }).then(res => res.data),
  createPhc: (data) => api.post('/phcs', data).then(res => res.data),
  updatePhc: (id, data) => api.put(`/phcs/${id}`, data).then(res => res.data),
  deletePhc: (id) => api.delete(`/phcs/${id}`).then(res => res.data),

  // Medicines
  getMedicines: (params) => api.get('/medicines', { params }).then(res => res.data),
  createMedicine: (data) => api.post('/medicines', data).then(res => res.data),
  updateMedicine: (id, data) => api.put(`/medicines/${id}`, data).then(res => res.data),
  deleteMedicine: (id) => api.delete(`/medicines/${id}`).then(res => res.data),

  // Stock
  getStock: (params) => api.get('/stock', { params }).then(res => res.data),
  saveStock: (data) => api.post('/stock', data).then(res => res.data),
  deleteStock: (id) => api.delete(`/stock/${id}`).then(res => res.data),

  // Footfall
  getFootfall: (params) => api.get('/footfall', { params }).then(res => res.data),
  recordFootfall: (data) => api.post('/footfall', data).then(res => res.data),
  deleteFootfall: (id) => api.delete(`/footfall/${id}`).then(res => res.data),

  // Beds
  getBeds: (params) => api.get('/beds', { params }).then(res => res.data),
  saveBeds: (data) => api.post('/beds', data).then(res => res.data),
  deleteBeds: (id) => api.delete(`/beds/${id}`).then(res => res.data),

  // Attendance
  getAttendance: (params) => api.get('/attendance', { params }).then(res => res.data),
  recordAttendance: (data) => api.post('/attendance', data).then(res => res.data),
  deleteAttendance: (id) => api.delete(`/attendance/${id}`).then(res => res.data),

  // Analytics & Forecast & Risk
  getForecast: (phcId, medicineId, horizon = 14) =>
    api.get(`/forecast/${phcId}/${medicineId}?horizon=${horizon}`).then(res => res.data),
  getRisk: (phcId, medicineId) =>
    api.get(`/risk/${phcId}/${medicineId}`).then(res => res.data),
  getAlerts: (params) => api.get('/alerts', { params }).then(res => res.data),

  // Redistribution
  getRedistribution: () => api.get('/redistribution').then(res => res.data),
  generateRedistribution: () => api.post('/redistribution/generate').then(res => res.data),

  // Emergency Simulation
  runEmergencySimulation: (data) => api.post('/emergency/simulate', data).then(res => res.data),

  // Federated AI
  getFederatedStatus: () => api.get('/federated/status').then(res => res.data),
  trainFederated: (rounds = 5) => api.post(`/federated/train?rounds=${rounds}`).then(res => res.data),

  // Gemini AI
  explainRisk: (phcId, medicineId) =>
    api.post('/gemini/explain-risk', { phc_id: phcId, medicine_id: medicineId }).then(res => res.data),
  getCriticalSummary: () => api.post('/gemini/summary').then(res => res.data),
  askAssistant: (data) => api.post('/gemini/assistant', data).then(res => res.data),

  // CSV
  validateCsv: (formData) =>
    api.post('/csv/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data),
  importCsv: (formData) =>
    api.post('/csv/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data),

  // Demo Mode
  loadDemoData: () => api.post('/demo/load').then(res => res.data),
  clearDemoData: () => api.delete('/demo/clear').then(res => res.data),
  getDemoStatus: () => api.get('/demo/status').then(res => res.data),
};
