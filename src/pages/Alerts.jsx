import React, { useEffect, useState } from 'react';
import { fetchAlerts, updateAlertStatus } from '../services/api';
import SeverityBadge from '../components/SeverityBadge';
import { Check, X, AlertTriangle } from 'lucide-react';

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const { data } = await fetchAlerts();
      setAlerts(data);
    } catch (e) {
      console.error('Failed to load alerts', e);
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (id, newStatus) => {
    try {
      await updateAlertStatus(id, newStatus);
      setAlerts(prev => prev.map(a => (a.id === id ? { ...a, status: newStatus } : a)));
    } catch (e) {
      console.error('Status update failed', e);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading alerts...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-primary">Threat Alerts</h2>
      <div className="bg-white rounded shadow overflow-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-1 text-left text-sm">Alert ID</th>
              <th className="px-2 py-1 text-left text-sm">Timestamp</th>
              <th className="px-2 py-1 text-left text-sm">Source IP</th>
              <th className="px-2 py-1 text-left text-sm">Category</th>
              <th className="px-2 py-1 text-left text-sm">Severity</th>
              <th className="px-2 py-1 text-left text-sm">Reason</th>
              <th className="px-2 py-1 text-left text-sm">Recommendation</th>
              <th className="px-2 py-1 text-left text-sm">Status</th>
              <th className="px-2 py-1 text-left text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map(alert => (
              <tr key={alert.id} className="border-t">
                <td className="px-2 py-1 text-sm">{alert.id}</td>
                <td className="px-2 py-1 text-sm">{new Date(alert.timestamp).toLocaleString()}</td>
                <td className="px-2 py-1 text-sm">{alert.sourceIp}</td>
                <td className="px-2 py-1 text-sm">{alert.category}</td>
                <td className="px-2 py-1 text-sm"><SeverityBadge severity={alert.severity} /></td>
                <td className="px-2 py-1 text-sm">{alert.reason}</td>
                <td className="px-2 py-1 text-sm">{alert.recommendation}</td>
                <td className="px-2 py-1 text-sm">{alert.status}</td>
                <td className="px-2 py-1 text-sm space-x-1">
                  {alert.status !== 'Resolved' && (
                    <button
                      onClick={() => changeStatus(alert.id, 'Resolved')}
                      className="text-success hover:underline"
                    >
                      <Check className="w-4 h-4 inline" /> Resolve
                    </button>
                  )}
                  {alert.status !== 'Under Review' && (
                    <button
                      onClick={() => changeStatus(alert.id, 'Under Review')}
                      className="text-warning hover:underline"
                    >
                      <AlertTriangle className="w-4 h-4 inline" /> Review
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Alerts;
