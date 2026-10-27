import React, { useEffect, useState } from 'react';
import SummaryCard from '../components/SummaryCard';
import SeverityBadge from '../components/SeverityBadge';
import { fetchLogRecords, fetchAlerts } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';
import { ClipboardList, AlertCircle, CheckCircle, Clock } from 'lucide-react';

function Dashboard() {
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [{ data: logData }, { data: alertData }] = await Promise.all([
          fetchLogRecords(),
          fetchAlerts(),
        ]);
        setLogs(logData);
        setAlerts(alertData);
      } catch (e) {
        console.error('Error loading dashboard data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute summary metrics
  const totalLogs = logs.length;
  const totalThreats = alerts.length;
  const criticalAlerts = alerts.filter(a => a.severity.toLowerCase() === 'critical').length;
  const safeEvents = logs.filter(l => l.severity && l.severity.toLowerCase() === 'info').length;

  // Prepare data for severity bar chart
  const severityCounts = alerts.reduce((acc, cur) => {
    const sev = cur.severity.toLowerCase();
    acc[sev] = (acc[sev] || 0) + 1;
    return acc;
  }, {});
  const barData = Object.entries(severityCounts).map(([sev, count]) => ({ severity: sev, count }));

  // Prepare data for events over time (group by hour)
  const eventsByHour = logs.reduce((acc, cur) => {
    if (!cur.timestamp) return acc;
    const date = new Date(cur.timestamp);
    const hour = date.getHours();
    const key = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ${hour}:00`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const lineData = Object.entries(eventsByHour).map(([time, count]) => ({ time, count }));

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Logs Analyzed"
          value={totalLogs}
          icon={Clock}
          color="border border-gray-200"
        />
        <SummaryCard
          title="Total Threats Detected"
          value={totalThreats}
          icon={AlertCircle}
          color="border border-gray-200"
        />
        <SummaryCard
          title="Critical Alerts"
          value={criticalAlerts}
          icon={ClipboardList}
          color="border border-gray-200"
        />
        <SummaryCard
          title="Safe Events"
          value={safeEvents}
          icon={CheckCircle}
          color="border border-gray-200"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-medium mb-2 text-primary">Threats by Severity</h2>
          <BarChart width={500} height={300} data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="severity" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#ef4444" />
          </BarChart>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-medium mb-2 text-primary">Events Over Time (by hour)</h2>
          <LineChart width={500} height={300} data={lineData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#1e3a8a" />
          </LineChart>
        </div>
      </div>

      {/* Recent alerts table */}
      <div className="bg-white p-4 rounded shadow overflow-auto">
        <h2 className="text-lg font-medium mb-2 text-primary">Recent Alerts</h2>
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-1 text-left text-sm">Timestamp</th>
              <th className="px-2 py-1 text-left text-sm">Source IP</th>
              <th className="px-2 py-1 text-left text-sm">Category</th>
              <th className="px-2 py-1 text-left text-sm">Severity</th>
              <th className="px-2 py-1 text-left text-sm">Status</th>
            </tr>
          </thead>
          <tbody>
            {alerts.slice(0, 10).map(alert => (
              <tr key={alert.id} className="border-t">
                <td className="px-2 py-1 text-sm">{new Date(alert.timestamp).toLocaleString()}</td>
                <td className="px-2 py-1 text-sm">{alert.sourceIp}</td>
                <td className="px-2 py-1 text-sm">{alert.category}</td>
                <td className="px-2 py-1 text-sm"><SeverityBadge severity={alert.severity} /></td>
                <td className="px-2 py-1 text-sm">{alert.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-2 text-right">
          <a href="/alerts" className="text-primary hover:underline">View all alerts →</a>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
