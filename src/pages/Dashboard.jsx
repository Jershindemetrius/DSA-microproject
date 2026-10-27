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
  Clock,
  ShieldCheck,
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
  const { logs, alerts, stats, activeFileName } = useLogs();

  // Threats by severity bar data
  const barData = [
    { severity: 'Critical', count: stats.criticalAlerts, key: 'critical' },
    { severity: 'High', count: stats.highAlerts, key: 'high' },
    { severity: 'Medium', count: stats.mediumAlerts, key: 'medium' },
    { severity: 'Safe/Info', count: stats.safeEvents, key: 'info' },
  ];

  // Events grouped by hour/time for the timeline chart
  const timelineData = React.useMemo(() => {
    const timeMap = {};
    logs.forEach(log => {
      if (!log.timestamp) return;
      const d = new Date(log.timestamp);
      // Group by HH:MM bucket
      const timeKey = `${String(d.getUTCHours()).padStart(2, '0')}:${d.getUTCMinutes() < 30 ? '00' : '30'}`;
      timeMap[timeKey] = (timeMap[timeKey] || 0) + 1;
    });

    return Object.entries(timeMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, count]) => ({ time: `${time} UTC`, events: count }));
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Action */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Active Dataset: {activeFileName}
            </span>
            <span className="text-xs text-slate-400">Heuristic Engine v1.0</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Security Overview & Threat Detection
          </h2>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
            Currently analyzing processed security logs to identify suspicious brute-force login anomalies, unauthorized path probing, and elevated server exceptions.
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
          value={stats.totalLogs}
          subtitle="System & server events"
          icon={FileText}
          accent="blue"
        />
        <SummaryCard
          title="Threats Detected"
          value={stats.totalThreats}
          subtitle="Potential security incidents"
          icon={ShieldAlert}
          accent="orange"
        />
        <SummaryCard
          title="Critical Alerts"
          value={stats.criticalAlerts}
          subtitle="Requires immediate review"
          icon={AlertOctagon}
          accent="red"
        />
        <SummaryCard
          title="Safe Events"
          value={stats.safeEvents}
          subtitle="Routine & verified actions"
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
              <h3 className="text-sm font-bold text-slate-900">Events by Severity</h3>
              <p className="text-xs text-gray-500">Distribution across analyzed log records</p>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
              {stats.totalThreats} Flagged Total
            </span>
          </div>
          <div className="h-64 w-full">
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
          </div>
        </div>

        {/* Security Events Over Time Line Chart */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Security Events Timeline</h3>
              <p className="text-xs text-gray-500">Event distribution across chronological windows</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Event Trend</span>
            </div>
          </div>
          <div className="h-64 w-full">
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
                {alerts.length} Total
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
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    No threat alerts detected in the current log dataset.
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
                        alert.status === 'Resolved' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : alert.status === 'Under Review'
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
