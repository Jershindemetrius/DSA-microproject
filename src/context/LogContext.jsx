import React, { createContext, useContext, useState, useMemo } from 'react';
import initialLogs from '../data/sampleLogs';
import { analyzeLogs, parseRawLogText } from '../utils/analyzer';

const LogContext = createContext();

export function LogProvider({ children }) {
  // Initialize with analyzed sample data
  const initialAnalysis = useMemo(() => {
    return analyzeLogs(initialLogs);
  }, []);

  const [logs, setLogs] = useState(initialAnalysis.analyzedLogs);
  const [alerts, setAlerts] = useState(initialAnalysis.detectedAlerts);
  const [lastAnalysisDate, setLastAnalysisDate] = useState(new Date().toISOString());
  const [activeFileName, setActiveFileName] = useState('sample-cyber-traffic.log');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Derived Statistics directly from current data
  const stats = useMemo(() => {
    const totalLogs = logs.length;
    const totalThreats = alerts.length;
    const criticalAlerts = alerts.filter(a => a.severity.toLowerCase() === 'critical').length;
    const highAlerts = alerts.filter(a => a.severity.toLowerCase() === 'high').length;
    const mediumAlerts = alerts.filter(a => a.severity.toLowerCase() === 'medium').length;
    const safeEvents = logs.filter(l => !l.flagged && (l.severity?.toLowerCase() === 'info' || l.severity?.toLowerCase() === 'low')).length;

    // Severity distribution for charts
    const severityCounts = {
      critical: criticalAlerts,
      high: highAlerts,
      medium: mediumAlerts,
      info: safeEvents
    };

    // Category distribution
    const categoryCounts = alerts.reduce((acc, alert) => {
      acc[alert.category] = (acc[alert.category] || 0) + 1;
      return acc;
    }, {});

    // Suspicious source IPs
    const suspiciousIps = Array.from(new Set(alerts.map(a => a.sourceIp)));

    return {
      totalLogs,
      totalThreats,
      criticalAlerts,
      highAlerts,
      mediumAlerts,
      safeEvents,
      severityCounts,
      categoryCounts,
      suspiciousIps
    };
  }, [logs, alerts]);

  // Handle uploaded text or raw log objects
  const processNewLogs = (rawLogs, fileName = 'uploaded-file.log') => {
    const parsed = Array.isArray(rawLogs) ? rawLogs : parseRawLogText(rawLogs);
    const { analyzedLogs, detectedAlerts } = analyzeLogs(parsed);
    setLogs(analyzedLogs);
    setAlerts(detectedAlerts);
    setActiveFileName(fileName);
    setLastAnalysisDate(new Date().toISOString());
    return { analyzedLogs, detectedAlerts };
  };

  // Reset to original college sample logs
  const resetToSample = () => {
    const res = analyzeLogs(initialLogs);
    setLogs(res.analyzedLogs);
    setAlerts(res.detectedAlerts);
    setActiveFileName('sample-cyber-traffic.log');
    setLastAnalysisDate(new Date().toISOString());
  };

  // Update alert review status
  const updateAlertStatus = (id, newStatus) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  return (
    <LogContext.Provider value={{
      logs,
      alerts,
      stats,
      lastAnalysisDate,
      activeFileName,
      processNewLogs,
      resetToSample,
      updateAlertStatus,
      mobileNavOpen,
      setMobileNavOpen
    }}>
      {children}
    </LogContext.Provider>
  );
}

export function useLogs() {
  const context = useContext(LogContext);
  if (!context) {
    throw new Error('useLogs must be used within a LogProvider');
  }
  return context;
}
