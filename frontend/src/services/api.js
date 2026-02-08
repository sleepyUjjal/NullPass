import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api', // Vite Proxy
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

export default {
  // Login Polling
  initiateLogin: () => apiClient.post('/auth/login/request'),
  checkChallengeStatus: (id) => apiClient.get(`/auth/challenge/status?challenge_id=${id}`),

  // Enrollment Polling (QR Display)
  getEnrollmentQR: () => apiClient.post('/auth/enroll/qr'),

  // *** NEW: Action Methods (from Authenticate.jsx) ***
  finalizeEnrollment: (data) => apiClient.post('/auth/enroll', data), // Matches path('enroll', views.enroll_device)
  verifySignature: (data) => apiClient.post('/auth/verify', data),     // Matches path('verify', views.verify_signature)

  // Dashboard
  getDashboardData: () => apiClient.get('/dashboard/stats/')
};