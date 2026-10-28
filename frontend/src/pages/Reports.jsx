import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  FileCheck,
  FileSpreadsheet,
  Printer,
  Server,
  ShieldCheck,
} from 'lucide-react';
import { useLogs } from '../context/LogContext';
import { exportLogs } from '../services/api';

function Reports() {
  const { dashboard, dashboardLoading, dashboardError, alerts, activeFileName, refreshData } = useLogs();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const dateLabel = new Date().toLocaleDateString();
  const severityCounts = dashboard?.alerts_by_severity || {};
  const categoryCounts = useMemo(() => alerts.reduce((counts, alert) => {
    const category = alert.detection_type || alert.category;
    if (category) counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {}), [alerts]);
  const severityRows = [
    ['Critical', severityCounts.critical ?? 0, 'border-red-200 bg-red-50/50 text-red-800'],
    ['High', severityCounts.high ?? 0, 'border-orange-200 bg-orange-50/50 text-orange-800'],
    ['Medium', severityCounts.medium ?? 0, 'border-amber-200 bg-amber-50/50 text-amber-800'],
    ['Low / Info', (severityCounts.low ?? 0) + (severityCounts.info ?? 0), 'border-emerald-200 bg-emerald-50/50 text-emerald-800'],
  ];

  const downloadCsv = async () => {
    setExporting(true);
    setExportError('');
    try {
      const csv = await exportLogs();
      const url = URL.createObjectURL(csv);
      const link = document.createElement('a');
      link.href = url;
      link.download = `security-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(error.message);
    } finally {
      setExporting(false);
    }
  };

  const value = (metric) => (dashboard ? metric : '—');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="print:hidden bg-white rounded-lg border border-gray-200 shadow-2xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Security Assessment Report</h2>
          <p className="text-xs text-gray-500">Generated from persisted backend log and alert data.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={downloadCsv}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-white border border-gray-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{exporting ? 'Exporting…' : 'Export CSV'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold bg-blue-800 text-white hover:bg-blue-900"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report (PDF)</span>
          </button>
        </div>
      </div>

      {exportError && (
        <div role="alert" className="print:hidden rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {exportError}
        </div>
      )}
      {dashboardError && (
        <div role="alert" className="print:hidden rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {dashboardError}
          <button onClick={refreshData} className="ml-3 font-semibold underline">Retry</button>
        </div>
      )}

      <article className="bg-white rounded-lg border border-gray-200 shadow-xs p-6 md:p-8 space-y-6 text-slate-900 print:border-none print:shadow-none print:p-0">
        <header className="border-b-2 border-slate-900 pb-5">
          <span className="text-[11px] font-bold tracking-widest uppercase text-blue-800 block">
            Intelligent Cybersecurity Log Analyzer
          </span>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
            Security Assessment Report
          </h1>
          <p className="text-xs text-gray-600 mt-1">Report generated: {dateLabel}</p>
        </header>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-gray-200 text-xs">
          <div>
            <span className="text-gray-500 block text-[11px] font-medium">Uploaded Source</span>
            <span className="font-semibold text-slate-800 break-words">{activeFileName || 'Not recorded'}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[11px] font-medium">Report Date</span>
            <span className="font-semibold text-slate-800">{dateLabel}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[11px] font-medium">Stored Logs</span>
            <span className="font-bold text-blue-900 text-sm">{value(dashboard?.total_log_count)}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[11px] font-medium">Alerts</span>
            <span className="font-bold text-red-700 text-sm">{value(dashboard?.total_alert_count)}</span>
          </div>
        </section>

        {dashboardLoading && <p className="text-sm text-gray-500">Loading report data…</p>}
        <section>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-blue-800" />
            <span>Alert Counts by Severity</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {severityRows.map(([label, count, classes]) => (
              <div key={label} className={`p-3 rounded-lg border ${classes}`}>
                <span className="text-xs font-semibold block">{label}</span>
                <span className="text-2xl font-bold mt-1 block">{value(count)}</span>
              </div>
            ))}
          </div>
          {dashboard && (
            <div className="mt-3 text-xs text-gray-600">
              Open: {dashboard.alerts_by_status?.open ?? 0}
              {' · '}Acknowledged: {dashboard.alerts_by_status?.acknowledged ?? 0}
              {' · '}Resolved: {dashboard.alerts_by_status?.resolved ?? 0}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-800" />
            <span>Detected Categories</span>
          </h2>
          {Object.keys(categoryCounts).length === 0 ? (
            <p className="text-xs text-gray-500 italic">
              {dashboardLoading ? 'Loading alert categories…' : 'No alert categories are available.'}
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              {Object.entries(categoryCounts).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between p-2.5 rounded border border-gray-200 bg-slate-50/50">
                  <span className="font-semibold text-slate-800">{category}</span>
                  <span className="px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 font-mono">
                    {count} alert{count === 1 ? '' : 's'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Server className="w-4 h-4 text-blue-800" />
            <span>Frequently Failed-Login Source IPs</span>
          </h2>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {!dashboard?.most_suspicious_ips?.length ? (
              <span className="text-gray-500 font-sans italic">
                {dashboardLoading ? 'Loading source IPs…' : 'No suspicious IPs were returned.'}
              </span>
            ) : dashboard.most_suspicious_ips.map(({ ip, count }) => (
              <span key={ip} className="px-3 py-1 rounded bg-slate-100 border border-slate-300 font-semibold text-slate-800">
                {ip} ({count})
              </span>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-blue-800" />
            <span>Authentication Summary</span>
          </h2>
          <div className="p-4 rounded-lg bg-slate-50 border border-gray-200 text-xs text-slate-700 leading-relaxed">
            The backend reports {value(dashboard?.successful_login_count)} successful and{' '}
            {value(dashboard?.failed_login_count)} failed login events among{' '}
            {value(dashboard?.total_log_count)} stored log records.
          </div>
        </section>
      </article>
    </div>
  );
}

export default Reports;
