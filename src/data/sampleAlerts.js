// src/data/sampleAlerts.js
/**
 * Sample alert data for demo mode.
 */
const alerts = [
  {
    id: 'A1',
    timestamp: '2026-10-26T08:18:10Z',
    sourceIp: '192.168.1.10',
    category: 'Brute-force attempt',
    severity: 'critical',
    reason: '3+ failed logins within 5 minutes from same IP',
    recommendation: 'Lock the account and investigate the source IP',
    status: 'New',
  },
  {
    id: 'A2',
    timestamp: '2026-10-26T09:06:00Z',
    sourceIp: '10.0.0.5',
    category: 'Unauthorized resource access',
    severity: 'high',
    reason: 'Attempt to access /admin panel - denied (403)',
    recommendation: 'Review user privileges and firewall rules',
    status: 'Under Review',
  },
  {
    id: 'A3',
    timestamp: '2026-10-26T10:15:30Z',
    sourceIp: '203.0.113.42',
    category: 'Repeated HTTP 401',
    severity: 'medium',
    reason: 'Multiple 401 responses from /login endpoint',
    recommendation: 'Check for possible credential stuffing',
    status: 'New',
  },
];

export default alerts;
