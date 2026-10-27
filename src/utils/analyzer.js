// src/utils/analyzer.js
/**
 * Intelligent Rule-Based Cybersecurity Log Analyzer
 * College Microproject Demonstration Engine
 * 
 * Analyzes server/system logs and identifies potential security anomalies
 * based on transparent, configurable heuristics.
 */

export function analyzeLogs(logs) {
  const analyzedLogs = [];
  const detectedAlerts = [];
  const failureTracking = {};
  const httpErrorTracking = {};
  let alertCounter = 1;

  // Sort logs chronologically for accurate window analysis
  const sorted = [...logs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  sorted.forEach((log, index) => {
    const entry = { ...log, id: log.id || `log-${index + 1}` };
    const now = new Date(entry.timestamp);
    const ip = entry.sourceIp || 'Unknown';
    let flagged = false;
    let detectionLabel = null;
    let reasonText = null;
    let category = null;
    let severity = entry.severity || 'info';
    let recommendation = null;

    // Rule 1: Brute Force Login Detection (>=3 failed logins from same IP within 5 minutes)
    const isFailedLogin = (entry.eventType === 'login' || entry.eventType === 'auth') &&
      /failed|invalid|unauthorized|bad password/i.test(entry.message);

    if (isFailedLogin) {
      if (!failureTracking[ip]) failureTracking[ip] = [];
      failureTracking[ip] = failureTracking[ip].filter(t => (now - t) <= 5 * 60 * 1000);
      failureTracking[ip].push(now);

      if (failureTracking[ip].length >= 3) {
        flagged = true;
        category = 'Potential Brute-Force Attempt';
        detectionLabel = 'brute-force';
        severity = 'critical';
        reasonText = `Multiple failed login attempts (${failureTracking[ip].length}) from ${ip} within a 5-minute window`;
        recommendation = 'Temporarily throttle or blacklist source IP in firewall and notify account owner.';
      } else {
        severity = 'medium';
      }
    }

    // Rule 2: Successful Login following Multiple Failures (Suspicious Compromise)
    const isSuccessfulLogin = (entry.eventType === 'login' || entry.eventType === 'auth') &&
      /accepted|successful|logged in/i.test(entry.message);

    if (isSuccessfulLogin && failureTracking[ip] && failureTracking[ip].length >= 2) {
      flagged = true;
      category = 'Suspicious Access After Failures';
      detectionLabel = 'suspicious-login';
      severity = 'high';
      reasonText = `Successful authentication immediately following ${failureTracking[ip].length} failed attempts from IP ${ip}`;
      recommendation = 'Verify identity with secondary MFA challenge and audit current active user session.';
      // Reset tracker after flagging
      failureTracking[ip] = [];
    }

    // Rule 3: Restricted Sensitive Resource Access
    const sensitivePaths = /(\/admin|\/\.env|\/wp-admin|\/etc\/passwd|\/config|\/backup|\/api\/v1\/internal)/i;
    if (sensitivePaths.test(entry.message) || entry.eventType === 'resource_access') {
      const match = entry.message.match(sensitivePaths);
      const pathHit = match ? match[0] : 'Restricted Endpoint';
      flagged = true;
      category = 'Sensitive Resource Probing';
      detectionLabel = 'sensitive-path';
      severity = /admin|config/i.test(pathHit) ? 'high' : 'critical';
      reasonText = `Access attempt to sensitive system resource "${pathHit}" detected from ${ip}`;
      recommendation = 'Ensure web server blocklists dotfiles, verify directory permissions, and inspect access logs.';
    }

    // Rule 4: Repeated HTTP 401/403 Anomaly Spike
    const isHttpForbiddenOrUnauthorized = /401|403/i.test(entry.message) || entry.eventType === 'http_error';
    if (isHttpForbiddenOrUnauthorized) {
      if (!httpErrorTracking[ip]) httpErrorTracking[ip] = [];
      httpErrorTracking[ip] = httpErrorTracking[ip].filter(t => (now - t) <= 3 * 60 * 1000);
      httpErrorTracking[ip].push(now);

      if (httpErrorTracking[ip].length >= 3) {
        flagged = true;
        category = 'Repeated HTTP 401/403 Probing';
        detectionLabel = 'auth-enumeration';
        severity = 'high';
        reasonText = `High volume of HTTP client-side authorization denials (${httpErrorTracking[ip].length} errors) from ${ip}`;
        recommendation = 'Implement rate limiting and inspect WAF logs for automated fuzzing or scraping tools.';
      }
    }

    // Rule 5: Internal Server Error Spike (HTTP 500 / Crash / Exception)
    const isServerError = /500|exception|fatal error|segmentation fault/i.test(entry.message);
    if (isServerError && !flagged) {
      flagged = true;
      category = 'Unusual Server Error Spike';
      detectionLabel = 'server-anomaly';
      severity = 'high';
      reasonText = `Application reported unexpected internal error or crash: "${entry.message.slice(0, 70)}"`;
      recommendation = 'Review application stack traces, database connectivity, and check for input exploit vectors.';
    }

    // Apply detection metadata to log record
    entry.severity = severity;
    entry.detection = detectionLabel || (flagged ? 'flagged' : 'normal');
    entry.flagged = flagged;

    // Create an alert record if flagged
    if (flagged && category) {
      // Avoid duplicate alert for the exact same event timestamp and IP
      const exists = detectedAlerts.some(a => a.sourceIp === ip && a.category === category && Math.abs(new Date(a.timestamp) - now) < 2000);
      if (!exists) {
        detectedAlerts.push({
          id: `ALT-2026-${String(alertCounter++).padStart(3, '0')}`,
          timestamp: entry.timestamp,
          sourceIp: ip,
          category,
          severity,
          reason: reasonText,
          recommendation: recommendation || 'Review associated firewall logs and verify system integrity.',
          status: 'New'
        });
      }
    }

    analyzedLogs.push(entry);
  });

  return {
    analyzedLogs,
    detectedAlerts
  };
}

/**
 * Helper to parse plain text or .log raw files into structured log objects
 */
export function parseRawLogText(content) {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const parsed = [];

  lines.forEach((line, index) => {
    // Attempt standard formats: [ISO-Date] [IP] [EventType] [Severity] Message
    // Or Apache / Syslog formatted lines
    const ipMatch = line.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
    const dateMatch = line.match(/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?/);
    const sourceIp = ipMatch ? ipMatch[0] : `192.168.1.${10 + (index % 15)}`;
    const timestamp = dateMatch ? new Date(dateMatch[0]).toISOString() : new Date(Date.now() - (lines.length - index) * 60000).toISOString();

    let eventType = 'system';
    if (/login|auth|password|ssh/i.test(line)) eventType = 'login';
    else if (/GET|POST|HTTP|\/api/i.test(line)) eventType = 'http';
    else if (/403|denied|forbidden|admin/i.test(line)) eventType = 'resource_access';
    else if (/error|500|exception/i.test(line)) eventType = 'error';

    let severity = 'info';
    if (/critical|emergency/i.test(line)) severity = 'critical';
    else if (/error|failed|500|fatal/i.test(line)) severity = 'high';
    else if (/warning|warn|401|403|denied/i.test(line)) severity = 'medium';

    parsed.push({
      id: `LOG-RAW-${index + 1}`,
      timestamp,
      sourceIp,
      eventType,
      message: line,
      severity
    });
  });

  return parsed;
}
