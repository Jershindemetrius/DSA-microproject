import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
});

export const uploadLogFile = (file) => {
  // In demo mode, just resolve immediately
  return Promise.resolve({ data: { success: true } });
};

export const fetchLogRecords = () => {
  // In demo mode, fetch local sample data
  return import('../data/sampleLogs.js').then((mod) => ({ data: mod.default }));
};

export const fetchAlerts = () => {
  return import('../data/sampleAlerts.js').then((mod) => ({ data: mod.default }));
};

export const updateAlertStatus = (id, status) => {
  // Demo: pretend success
  return Promise.resolve({ data: { id, status } });
};

export const fetchReport = () => {
  return import('../data/sampleReport.js').then((mod) => ({ data: mod.default }));
};
