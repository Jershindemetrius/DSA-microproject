// src/data/sampleLogs.js
/**
 * Sample log entries for demo mode.
 * Each entry contains: timestamp, sourceIp, eventType, message, severity.
 */
const logs = [
  {
    timestamp: '2026-10-26T08:15:00Z',
    sourceIp: '192.168.1.10',
    eventType: 'login',
    message: 'Failed password for invalid user admin',
    severity: 'high',
  },
  {
    timestamp: '2026-10-26T08:16:20Z',
    sourceIp: '192.168.1.10',
    eventType: 'login',
    message: 'Failed password for invalid user admin',
    severity: 'high',
  },
  {
    timestamp: '2026-10-26T08:17:45Z',
    sourceIp: '192.168.1.10',
    eventType: 'login',
    message: 'Failed password for invalid user admin',
    severity: 'high',
  },
  {
    timestamp: '2026-10-26T09:00:10Z',
    sourceIp: '10.0.0.5',
    eventType: 'login',
    message: 'Accepted password for user john',
    severity: 'info',
  },
  {
    timestamp: '2026-10-26T09:05:30Z',
    sourceIp: '10.0.0.5',
    eventType: 'resource_access',
    message: 'Attempt to access /admin panel - denied (403)',
    severity: 'medium',
  },
  {
    timestamp: '2026-10-26T10:12:00Z',
    sourceIp: '203.0.113.42',
    eventType: 'http',
    message: 'GET /login returned 401',
    severity: 'medium',
  },
  {
    timestamp: '2026-10-26T10:13:10Z',
    sourceIp: '203.0.113.42',
    eventType: 'http',
    message: 'GET /login returned 401',
    severity: 'medium',
  },
  {
    timestamp: '2026-10-26T10:14:22Z',
    sourceIp: '203.0.113.42',
    eventType: 'http',
    message: 'GET /login returned 401',
    severity: 'medium',
  },
  {
    timestamp: '2026-10-26T11:30:00Z',
    sourceIp: '172.16.0.8',
    eventType: 'file_error',
    message: 'Unexpected error code 500 while reading /var/log/syslog',
    severity: 'high',
  },
];

export default logs;
