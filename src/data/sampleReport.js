// src/data/sampleReport.js
/**
 * Sample analysis report data for demo mode.
 */
const report = {
  analysisDate: new Date().toISOString(),
  totalLogs: 9,
  threatCounts: {
    critical: 1,
    high: 1,
    medium: 1,
    info: 6,
  },
  categories: ['Brute-force attempt', 'Unauthorized resource access', 'Repeated HTTP 401'],
  suspiciousIps: ['192.168.1.10', '10.0.0.5', '203.0.113.42'],
  summary: 'The analysis identified multiple suspicious activities including a potential brute-force login attempt, unauthorized access attempts to restricted resources, and repeated HTTP 401 responses indicating possible credential stuffing.',
};

export default report;
