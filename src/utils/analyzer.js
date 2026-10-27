// src/utils/analyzer.js
/**
 * Simple rule‑based log analyzer used for demo purposes.
 * It scans log entries for repeated failed login attempts from the same IP
 * within a 5‑minute window and flags them as a potential brute‑force attack.
 * The function returns a new array of logs with an added `detection` field
 * (e.g. 'brute-force') when a rule matches. In a real project this logic
 * would be moved to a backend service.
 */
export function analyzeLogs(logs) {
  const enriched = [];
  const failureMap = {};

  logs.forEach((log) => {
    const newLog = { ...log };
    // Detect failed login attempts
    const isFailedLogin =
      log.eventType === 'login' && /failed/i.test(log.message);

    if (isFailedLogin) {
      const ip = log.sourceIp;
      if (!failureMap[ip]) failureMap[ip] = [];
      const now = new Date(log.timestamp);
      // Keep only failures within the last 5 minutes
      failureMap[ip] = failureMap[ip].filter(
        (t) => now - t <= 5 * 60 * 1000
      );
      failureMap[ip].push(now);

      if (failureMap[ip].length >= 3) {
        newLog.detection = 'brute-force';
        // In a full implementation we would also generate an alert record here.
      }
    }
    enriched.push(newLog);
  });

  return enriched;
}
