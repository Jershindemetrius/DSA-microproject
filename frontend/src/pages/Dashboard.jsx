import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  LineChart, 
  Line, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  FileText, 
  ShieldAlert, 
  AlertOctagon, 
  CheckCircle, 
  ArrowRight,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import SummaryCard from '../components/SummaryCard';
import SeverityBadge from '../components/SeverityBadge';
import { useLogs } from '../context/LogContext';

const SEVERITY_COLORS = {
  critical: '#dc2626', // red-600
  high: '#ea580c',     // orange-600
  medium: '#d97706',   // amber-600
  info: '#10b981',     // emerald-500
};

function Dashboard() {
  const {
    dashboard,
    dashboardLoading,
    dashboardError,
    alerts,
    alertsLoading,
    alertsError,
    refreshData,
    activeFileName,
  } = useLogs();

  // Threats by severity bar data
  const barData = [
    { severity: 'Critical', count: dashboard?.alerts_by_severity?.critical || 0, key: 'critical' },
    { severity: 'High', count: dashboard?.alerts_by_severity?.high || 0, key: 'high' },
    { severity: 'Medium', count: dashboard?.alerts_by_severity?.medium || 0, key: 'medium' },
    { severity: 'Low/Info', count: (dashboard?.alerts_by_severity?.low || 0) + (dashboard?.alerts_by_severity?.info || 0), key: 'info' },
  ];

  const timelineData = (dashboard?.event_volume || []).map((item) => ({
    time: item.date,
    events: item.count,
  }));
  const totalAlerts = dashboard?.total_alert_count;

  return (
    <div className="space-y-6">
      {(dashboardError || alertsError) && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p>{dashboardError || alertsError}</p>
          <button onClick={refreshData} className="mt-2 font-semibold underline">Retry loading dashboard data</button>
        </div>
      )}
      {dashboardLoading && <p className="text-sm text-gray-500">Loading dashboard data…</p>}
      {/* Top Banner with Quick Action */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              {activeFileName ? `Last uploaded: ${activeFileName}` : 'Database-backed overview'}
            </span>
            <span className="text-xs text-slate-400">Live backend metrics</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Security Overview & Threat Detection
          </h2>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
            Review persisted authentication activity, analysis alerts, and event volume from the connected backend.
          </p>
        </div>
        <Link
          to="/analyze"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-sm transition-colors shrink-0"
        >
          <span>Analyze New Logs</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Logs Processed"
          value={dashboard ? dashboard.total_log_count : '—'}
          subtitle="Persisted system and server events"
          icon={FileText}
          accent="blue"
        />
        <SummaryCard
          title="Threats Detected"
          value={totalAlerts ?? '—'}
          subtitle="Persisted potential security incidents"
          icon={ShieldAlert}
          accent="orange"
        />
        <SummaryCard
          title="Critical Alerts"
          value={dashboard ? (dashboard.alerts_by_severity?.critical || 0) : '—'}
          subtitle="Critical severity alerts"
          icon={AlertOctagon}
          accent="red"
        />
        <SummaryCard
          title="Failed Logins"
          value={dashboard ? dashboard.failed_login_count : '—'}
          subtitle="Authentication failures recorded"
          icon={CheckCircle}
          accent="green"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Severity Bar Chart */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Alerts by Severity</h3>
              <p className="text-xs text-gray-500">Distribution returned by the backend</p>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
              {totalAlerts ?? '—'} Alerts Total
            </span>
          </div>
          <div className="h-64 w-full">
            {!dashboard && !dashboardLoading ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">Severity data is unavailable.</div>
            ) : dashboardLoading && !dashboard ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">Loading severity data…</div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="severity" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {barData.map((entry) => (
                    <Cell key={entry.key} fill={SEVERITY_COLORS[entry.key]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Security Events Over Time Line Chart */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Security Events Timeline</h3>
              <p className="text-xs text-gray-500">Daily event totals returned by the backend</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Event Trend</span>
            </div>
          </div>
          <div className="h-64 w-full">
            {!dashboard && !dashboardLoading ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">Event volume is unavailable.</div>
            ) : dashboardLoading && !dashboard ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">Loading event volume…</div>
            ) : timelineData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">No event volume is available yet.</div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="events" 
                  stroke="#1e3a8a" 
                  strokeWidth={2.5} 
                  dot={{ r: 4, fill: '#1e3a8a' }} 
                  activeDot={{ r: 6, fill: '#3b82f6' }} 
                />
              </LineChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Alerts Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-4 md:p-5 flex items-center justify-between border-b border-gray-200 bg-slate-50/70">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Recent Detected Threat Alerts</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                {totalAlerts ?? '—'} Total
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Suspicious activities flagged by heuristic evaluation rules</p>
          </div>
          <Link
            to="/alerts"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-800 hover:text-blue-950 hover:underline"
          >
            <span>View All Alerts</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3">Alert ID</th>
                <th scope="col" className="px-4 py-3">Timestamp</th>
                <th scope="col" className="px-4 py-3">Source IP</th>
                <th scope="col" className="px-4 py-3">Threat Category</th>
                <th scope="col" className="px-4 py-3">Severity</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {alertsLoading ? (
                <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">Loading alerts…</td></tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    No alerts have been generated by analysis yet.
                  </td>
                </tr>
              ) : (
                alerts.slice(0, 5).map(alert => (
                  <tr key={alert.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-blue-900">
                      {alert.id}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">
                      {alert.sourceIp}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {alert.category}
                    </td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={alert.severity} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                        alert.status === 'resolved' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : alert.status === 'acknowledged'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to="/alerts"
                        className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
