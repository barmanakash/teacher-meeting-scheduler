import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');

      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);


// Auth
export const authApi = {
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  updateRole: (role: string) => api.patch('/auth/role', { role }),
};


// Meetings
export const meetingsApi = {
  getAll: (params?: any) => api.get('/meetings', { params }),
  getById: (id: string) => api.get(`/meetings/${id}`),
  create: (data: any) => api.post('/meetings', data),
  update: (id: string, data: any) => api.put(`/meetings/${id}`, data),
  cancel: (id: string, reason?: string) =>
    api.patch(`/meetings/${id}/cancel`, { reason }),
  getDashboard: () => api.get('/meetings/dashboard'),
};


// Attendance
export const attendanceApi = {
  getMeetingAttendance: (meetingId: string) =>
    api.get(`/attendance/meeting/${meetingId}`),

  markAttendance: (meetingId: string, data: any) =>
    api.post(`/attendance/meeting/${meetingId}/mark`, data),

  bulkMark: (meetingId: string, records: any[]) =>
    api.post(`/attendance/meeting/${meetingId}/bulk`, { records }),

  getCandidateAttendance: (candidateId?: string) =>
    candidateId
      ? api.get(`/attendance/candidate/${candidateId}`)
      : api.get('/attendance/my'),

  joinMeeting: (meetingId: string) =>
    api.post(`/attendance/meeting/${meetingId}/join`),

  leaveMeeting: (meetingId: string) =>
    api.post(`/attendance/meeting/${meetingId}/leave`),
};


// Users
export const usersApi = {
  getCandidates: (search?: string) =>
    api.get('/users/candidates', { params: { search } }),

  getTeachers: () =>
    api.get('/users/teachers'),

  getById: (id: string) =>
    api.get(`/users/${id}`),

  updateProfile: (data: any) =>
    api.put('/users/profile', data),
};


// Reports
export const reportsApi = {
  getAnalytics: (params?: any) =>
    api.get('/reports/analytics', { params }),

  exportExcel: (meetingId?: string) =>
    api.get('/reports/export/excel', {
      params: { meetingId },
      responseType: 'blob',
    }),

  exportPDF: (meetingId?: string) =>
    api.get('/reports/export/pdf', {
      params: { meetingId },
      responseType: 'blob',
    }),
};


// Availability
export const availabilityApi = {
  get: () => api.get('/availability'),

  update: (data: any) =>
    api.put('/availability', data),

  addBlock: (data: any) =>
    api.post('/availability/block', data),

  addHoliday: (date: string) =>
    api.post('/availability/holiday', { date }),
};


export default api;