import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  authTokenKey,
  fetchAlerts,
  fetchCurrentUser,
  fetchDashboardSummary,
  registerUser,
  signIn,
  updateAlertStatus as updateAlertStatusRequest,
} from '../services/api';

const LogContext = createContext(null);

function normalizeAlert(alert) {
  return {
    ...alert,
    timestamp: alert.detected_at,
    sourceIp: alert.source_ip,
    category: alert.title,
    reason: alert.description,
    recommendation: alert.recommended_action,
  };
}

export function LogProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState('');
  const [activeFileName, setActiveFileName] = useState('');

  const logout = useCallback(() => {
    sessionStorage.removeItem(authTokenKey);
    setUser(null);
    setDashboard(null);
    setAlerts([]);
    setAuthError('');
  }, []);

  useEffect(() => {
    const handleExpired = () => {
      logout();
      setAuthError('Your session expired. Please sign in again.');
      setAuthLoading(false);
    };
    window.addEventListener('cyberlog:auth-expired', handleExpired);
    return () => window.removeEventListener('cyberlog:auth-expired', handleExpired);
  }, [logout]);

  useEffect(() => {
    if (!sessionStorage.getItem(authTokenKey)) {
      setAuthLoading(false);
      return undefined;
    }

    let active = true;
    fetchCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch((error) => {
        if (active) {
          logout();
          setAuthError(error.message);
        }
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });
    return () => {
      active = false;
    };
  }, [logout]);

  useEffect(() => {
    if (!user) {
      setDashboard(null);
      setAlerts([]);
      return undefined;
    }

    let active = true;
    setDashboardLoading(true);
    setDashboardError('');
    fetchDashboardSummary()
      .then((data) => {
        if (active) setDashboard(data);
      })
      .catch((error) => {
        if (active) setDashboardError(error.message);
      })
      .finally(() => {
        if (active) setDashboardLoading(false);
      });

    setAlertsLoading(true);
    setAlertsError('');
    fetchAlerts()
      .then((data) => {
        if (active) setAlerts(data.map(normalizeAlert));
      })
      .catch((error) => {
        if (active) setAlertsError(error.message);
      })
      .finally(() => {
        if (active) setAlertsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, refreshVersion]);

  const login = useCallback(async (username, password) => {
    setAuthError('');
    const response = await signIn(username, password);
    sessionStorage.setItem(authTokenKey, response.access_token);
    const currentUser = await fetchCurrentUser();
    setUser(currentUser);
    return currentUser;
  }, []);

  const register = useCallback(async (credentials) => {
    setAuthError('');
    await registerUser(credentials);
    return login(credentials.username, credentials.password);
  }, [login]);

  const refreshData = useCallback(() => setRefreshVersion((version) => version + 1), []);

  const updateAlertStatus = useCallback(async (id, status, note) => {
    const updated = normalizeAlert(await updateAlertStatusRequest(id, status, note));
    setAlerts((current) => current.map((alert) => (alert.id === id ? updated : alert)));
    refreshData();
    return updated;
  }, [refreshData]);

  const value = useMemo(() => ({
    user,
    authLoading,
    authError,
    setAuthError,
    login,
    register,
    logout,
    mobileNavOpen,
    setMobileNavOpen,
    dashboard,
    dashboardLoading,
    dashboardError,
    alerts,
    alertsLoading,
    alertsError,
    refreshData,
    updateAlertStatus,
    activeFileName,
    setActiveFileName,
  }), [
    user,
    authLoading,
    authError,
    login,
    register,
    logout,
    mobileNavOpen,
    dashboard,
    dashboardLoading,
    dashboardError,
    alerts,
    alertsLoading,
    alertsError,
    refreshData,
    updateAlertStatus,
    activeFileName,
  ]);

  return <LogContext.Provider value={value}>{children}</LogContext.Provider>;
}

export function useLogs() {
  const context = useContext(LogContext);
  if (!context) {
    throw new Error('useLogs must be used within a LogProvider');
  }
  return context;
}
