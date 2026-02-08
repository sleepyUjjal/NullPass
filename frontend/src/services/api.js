import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export default {
  // --- AUTH ---
  initiateLogin: () => apiClient.post('/auth/login/request'),
  checkChallengeStatus: (id) => apiClient.get(`/auth/challenge/status?challenge_id=${id}`),
  finalizeEnrollment: (data) => apiClient.post('/auth/enroll', data), 
  verifySignature: (data) => apiClient.post('/auth/verify', data),     
  getEnrollmentQR: () => apiClient.post('/auth/enroll/qr'),
  validateSession: () => apiClient.post('/auth/session/validate'), 
  
  logout: () => apiClient.post('/auth/logout'),

  // --- DASHBOARD (NEW) ---
  // We now fetch data from 3 separate endpoints to build the full dashboard
  getStatistics: () => apiClient.get('/dashboard/statistics/'),
  getThreatSummary: () => apiClient.get('/dashboard/threat-summary/'),
  getEvents: () => apiClient.get('/dashboard/events/?limit=10'),
};