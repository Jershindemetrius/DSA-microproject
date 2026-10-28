import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle, 
  Eye, 
  X,
} from 'lucide-react';
import { useLogs } from '../context/LogContext';
import SeverityBadge from '../components/SeverityBadge';
import { fetchAlerts } from '../services/api';

const STATUS_LABELS = {
  open: 'Open',
  acknowledged: 'Acknowledged',
  resolved: 'Resolved',
};

function Alerts() {
  const {
    alerts,
    alertsLoading: sharedAlertsLoading,
    alertsError: sharedAlertsError,
    updateAlertStatus,
  } = useLogs();
  const [statusFilter, setStatusFilter] = useState('all');
  const [visibleAlerts, setVisibleAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState('');
  const [reload, setReload] = useState(0);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [actionSuccessNotice, setActionSuccessNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [updating, setUpdating] = useState(false);

  const filteredAlerts = visibleAlerts;

  useEffect(() => {
    if (statusFilter === 'all') {
      setVisibleAlerts(alerts);
      setAlertsLoading(sharedAlertsLoading);
      setAlertsError(sharedAlertsError);
      return undefined;
    }

    let active = true;
    setAlertsLoading(true);
    setAlertsError('');
    fetchAlerts({ status: statusFilter })
      .then((response) => {
        if (active) {
          setVisibleAlerts(response.map((alert) => ({
            ...alert,
            timestamp: alert.detected_at,
            sourceIp: alert.source_ip,
            category: alert.title,
            reason: alert.description,
            recommendation: alert.recommended_action,
          })));
        }
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
  }, [alerts, sharedAlertsLoading, sharedAlertsError, statusFilter, reload]);

  const handleStatusChange = async (id, newStatus) => {
    setUpdating(true);
    setActionError('');
    setActionSuccessNotice('');
    try {
      const updatedAlert = await updateAlertStatus(id, newStatus);
      setSelectedAlert(updatedAlert);
      setActionSuccessNotice(`Alert ${id} updated to "${newStatus}".`);
      setReload((current) => current + 1);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const statusCounts = {
    all: alerts.length,
    open: alerts.filter(a => a.status === 'open').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
  };

  return (
    <div className="space-y-4">
      {/* Notice Banner */}
      {actionSuccessNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccessNotice}</span>
          </div>
          <button onClick={() => setActionSuccessNotice('')} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {actionError && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-md text-xs">
          {actionError}
        </div>
      )}
      {alertsError && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-md text-xs">
          {alertsError}
          <button onClick={() => setReload((current) => current + 1)} className="ml-3 font-semibold underline">Retry</button>
        </div>
      )}

      {/* Filter Tabs Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-2xs p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Detected Threat Incidents</h2>
            <p className="text-xs text-gray-500">Heuristic detections classified as potential threats for security investigation</p>
          </div>
          <div className="text-xs text-gray-400 italic">
            * Detections represent educational security alerts rather than confirmed zero-day intrusions
          </div>
        </div>

        {/* Status Pill Filters */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Alerts ({statusCounts.all})
          </button>
          <button
            onClick={() => setStatusFilter('open')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'open'
                ? 'bg-red-600 text-white shadow-2xs'
                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            }`}
          >
            Open ({statusCounts.open})
          </button>
          <button
            onClick={() => setStatusFilter('acknowledged')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'acknowledged'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Acknowledged ({statusCounts.acknowledged})
          </button>
          <button
            onClick={() => setStatusFilter('Resolved')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'resolved'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Resolved ({statusCounts.resolved})
          </button>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3">Alert ID</th>
                <th scope="col" className="px-4 py-3">Timestamp</th>
                <th scope="col" className="px-4 py-3">Source IP</th>
                <th scope="col" className="px-4 py-3">Threat Category</th>
                <th scope="col" className="px-4 py-3">Severity</th>
                <th scope="col" className="px-4 py-3">Detection Reason</th>
                <th scope="col" className="px-4 py-3">Review Status</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {alertsLoading ? (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">Loading alerts…</td></tr>
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    No alerts have been returned for this status.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map(alert => (
                  <tr key={alert.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-blue-900 whitespace-nowrap">
                      {alert.id}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {alert.sourceIp}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                      {alert.category}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <SeverityBadge severity={alert.severity} />
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={alert.reason}>
                      {alert.reason}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                        alert.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : alert.status === 'acknowledged'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {STATUS_LABELS[alert.status] || alert.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => setSelectedAlert(alert)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline px-2 py-1 rounded bg-blue-50/60"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Investigation Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg border border-gray-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-orange-400" />
                <h3 className="font-semibold text-sm">Security Incident Investigation: {selectedAlert.id}</h3>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-gray-400 hover:text-white rounded-md p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-2.5 rounded border border-gray-200">
                  <span className="text-gray-500 block text-[11px] font-medium">Incident Category</span>
                  <span className="text-slate-900 font-bold">{selectedAlert.category}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-gray-200">
                  <span className="text-gray-500 block text-[11px] font-medium">Severity Classification</span>
                  <div className="mt-0.5"><SeverityBadge severity={selectedAlert.severity} /></div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-gray-200">
                  <span className="text-gray-500 block text-[11px] font-medium">Suspicious Source IP</span>
                  <span className="font-mono text-slate-800 font-semibold">{selectedAlert.sourceIp}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-gray-200">
                  <span className="text-gray-500 block text-[11px] font-medium">Detection Timestamp</span>
                  <span className="font-mono text-slate-800">{new Date(selectedAlert.timestamp).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <span className="text-gray-700 block font-semibold mb-1">Reason for Detection</span>
                <div className="p-3 bg-red-50 text-red-800 rounded border border-red-200 leading-relaxed font-sans">
                  {selectedAlert.reason}
                </div>
              </div>

              <div>
                <span className="text-gray-700 block font-semibold mb-1">Recommended Mitigation Action</span>
                <div className="p-3 bg-blue-50 text-blue-900 rounded border border-blue-200 leading-relaxed font-sans">
                  {selectedAlert.recommendation}
                </div>
              </div>

              {/* Status Management Bar */}
              <div className="pt-2 border-t border-gray-200">
                <span className="text-gray-700 block font-semibold mb-2">Update Incident Review Status:</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={updating}
                    onClick={() => handleStatusChange(selectedAlert.id, 'open')}
                    className={`px-3 py-1.5 rounded font-semibold text-xs border ${
                      selectedAlert.status === 'open'
                        ? 'bg-red-600 text-white border-red-700'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-gray-300'
                    }`}
                  >
                    Mark as Open
                  </button>
                  <button
                    disabled={updating}
                    onClick={() => handleStatusChange(selectedAlert.id, 'acknowledged')}
                    className={`px-3 py-1.5 rounded font-semibold text-xs border ${
                      selectedAlert.status === 'acknowledged'
                        ? 'bg-amber-600 text-white border-amber-700'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-gray-300'
                    }`}
                  >
                    Mark as Acknowledged
                  </button>
                  <button
                    disabled={updating}
                    onClick={() => handleStatusChange(selectedAlert.id, 'resolved')}
                    className={`px-3 py-1.5 rounded font-semibold text-xs border ${
                      selectedAlert.status === 'resolved'
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-gray-300'
                    }`}
                  >
                    Mark as Resolved
                  </button>
                </div>
                {updating && <p className="mt-2 text-xs text-gray-500">Saving status…</p>}
              </div>
            </div>

            <div className="flex justify-end px-5 py-3 border-t border-gray-200 bg-slate-50">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-1.5 rounded-md text-xs font-medium bg-slate-800 text-white hover:bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Alerts;
