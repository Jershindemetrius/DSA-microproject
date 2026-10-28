import axios from 'axios';

const TOKEN_KEY = 'cyberlog_access_token';
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }
    const status = error.response?.status;
    if (status === 401 && !error.config?.url?.startsWith('/auth/login')) {
      sessionStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('cyberlog:auth-expired'));
    }

    const detail = error.response?.data?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg).filter(Boolean).join('; ')
      : typeof detail === 'string'
        ? detail
        : error.code === 'ECONNABORTED'
          ? 'The request timed out. Please try again.'
          : error.response
            ? `Request failed with status ${status}.`
            : 'Could not reach the backend. Check that the API server is running.';
    return Promise.reject(new Error(message));
  },
);

export const authTokenKey = TOKEN_KEY;
export const signIn = async (username, password) => (await api.post('/auth/login', { username, password })).data;
export const registerUser = async (credentials) => (await api.post('/auth/register', credentials)).data;
export const fetchCurrentUser = async () => (await api.get('/auth/me')).data;
export const fetchDashboardSummary = async () => (await api.get('/dashboard/summary')).data;
export const fetchLogRecords = async (params = {}, options = {}) =>
  (await api.get('/logs', { params, ...options })).data;
export const fetchAlerts = async (params = {}) => (await api.get('/alerts', { params })).data;
export const updateAlertStatus = async (id, status, note) =>
  (await api.patch(`/alerts/${id}`, { status, note })).data;
export const uploadLogFile = async (file) => {
  const form = new FormData();
  form.append('file', file);
  return (await api.post('/logs/upload', form)).data;
};
export const runAnalysis = async (options = {}) => (await api.post('/analysis/run', options)).data;
export const fetchRules = async () => (await api.get('/rules')).data;
export const createRule = async (payload) => (await api.post('/rules', payload)).data;
export const updateRule = async (id, payload) => (await api.patch(`/rules/${id}`, payload)).data;
export const deleteLog = async (id) => api.delete(`/logs/${id}`);
export const exportLogs = async (params = {}) =>
  (await api.get('/logs/export.csv', { params, responseType: 'blob' })).data;
export const fetchAnalysisSummary = async () => (await api.get('/analysis/summary')).data;
export const checkHealth = async () => (await api.get('/health')).data;
