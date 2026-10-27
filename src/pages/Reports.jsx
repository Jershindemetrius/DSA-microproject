import React from 'react';
import { 
  Download, 
  Printer, 
  FileCheck, 
  ShieldCheck, 
  Calendar, 
  AlertTriangle,
  Server,
  FileSpreadsheet,
  Award
} from 'lucide-react';
import { useLogs } from '../context/LogContext';
import SeverityBadge from '../components/SeverityBadge';

function Reports() {
  const { logs, alerts, stats, lastAnalysisDate, activeFileName } = useLogs();

  const handleExportCsv = () => {
    const headers = ['Log ID', 'Timestamp', 'Source IP', 'Event Type', 'Severity', 'Detection Flag', 'Message'];
    const rows = logs.map(l => [
      l.id,
      new Date(l.timestamp).toISOString(),
      l.sourceIp,
      l.eventType,
      l.severity,
      l.detection || 'normal',
      `"${(l.message || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cybersecurity-analysis-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Action Header - Hidden when printing */}
      <div className="print:hidden bg-white rounded-lg border border-gray-200 shadow-2xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Security Assessment Report</h2>
          <p className="text-xs text-gray-500">Official evaluation documentation generated from transparent rule-based log analysis</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-white border border-gray-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold bg-blue-800 text-white hover:bg-blue-900 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-6 md:p-8 space-y-6 text-slate-900 print:border-none print:shadow-none print:p-0">
        {/* Academic Letterhead */}
        <div className="border-b-2 border-slate-900 pb-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-blue-800 block">
                Department of Computer Science & Cybersecurity
              </span>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
                Intelligent Cybersecurity Log Analyzer & Threat Detector
              </h1>
              <p className="text-xs text-gray-600 mt-0.5">
                Microproject Evaluation & Incident Classification Report
              </p>
            </div>
            <div className="text-right text-xs text-gray-500 font-mono hidden sm:block">
              <div>REPORT ID: #SEC-{new Date().getFullYear()}-094</div>
              <div>DATE: {new Date(lastAnalysisDate).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Executive Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-gray-200 text-xs">
          <div>
            <span className="text-gray-500 block text-[11px] font-medium">Log Source File</span>
            <span className="font-semibold text-slate-800 font-mono text-[11px]">{activeFileName}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[11px] font-medium">Evaluation Date</span>
            <span className="font-semibold text-slate-800">{new Date(lastAnalysisDate).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[11px] font-medium">Total Logs Evaluated</span>
            <span className="font-bold text-blue-900 text-sm">{stats.totalLogs} records</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[11px] font-medium">Total Threat Incidents</span>
            <span className="font-bold text-red-700 text-sm">{stats.totalThreats} flagged</span>
          </div>
        </div>

        {/* Severity Classification Breakdown */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-blue-800" />
            <span>1. Threat Counts by Severity Level</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-red-200 bg-red-50/50">
              <span className="text-xs font-semibold text-red-700 block">Critical Threats</span>
              <span className="text-2xl font-bold text-red-800 mt-1 block">{stats.criticalAlerts}</span>
              <span className="text-[11px] text-red-600 mt-0.5 block">Brute-force / sensitive file hits</span>
            </div>
            <div className="p-3 rounded-lg border border-orange-200 bg-orange-50/50">
              <span className="text-xs font-semibold text-orange-700 block">High Severity</span>
              <span className="text-2xl font-bold text-orange-800 mt-1 block">{stats.highAlerts}</span>
              <span className="text-[11px] text-orange-600 mt-0.5 block">Suspicious access & errors</span>
            </div>
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50">
              <span className="text-xs font-semibold text-amber-700 block">Medium Severity</span>
              <span className="text-2xl font-bold text-amber-800 mt-1 block">{stats.mediumAlerts}</span>
              <span className="text-[11px] text-amber-600 mt-0.5 block">Auth warnings & 401s</span>
            </div>
            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
              <span className="text-xs font-semibold text-emerald-700 block">Safe Events</span>
              <span className="text-2xl font-bold text-emerald-800 mt-1 block">{stats.safeEvents}</span>
              <span className="text-[11px] text-emerald-600 mt-0.5 block">Verified normal interactions</span>
            </div>
          </div>
        </div>

        {/* Detected Threat Categories */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-800" />
            <span>2. Detected Threat Categories</span>
          </h3>
          <div className="space-y-2 text-xs">
            {Object.keys(stats.categoryCounts).length === 0 ? (
              <p className="text-gray-500 italic">No threat categories triggered.</p>
            ) : (
              Object.entries(stats.categoryCounts).map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between p-2.5 rounded border border-gray-200 bg-slate-50/50">
                  <span className="font-semibold text-slate-800">{cat}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 font-mono">
                    {count} incident{count > 1 ? 's' : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Suspicious IP Addresses */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Server className="w-4 h-4 text-blue-800" />
            <span>3. Suspicious Source IP Addresses Identified</span>
          </h3>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {stats.suspiciousIps.length === 0 ? (
              <span className="text-gray-500 font-sans italic">None identified in current batch.</span>
            ) : (
              stats.suspiciousIps.map(ip => (
                <span key={ip} className="px-3 py-1 rounded bg-slate-100 border border-slate-300 font-semibold text-slate-800">
                  {ip}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Summary of Findings */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-blue-800" />
            <span>4. Summary of Findings & Faculty Evaluation Notes</span>
          </h3>
          <div className="p-4 rounded-lg bg-slate-50 border border-gray-200 text-xs text-slate-700 leading-relaxed space-y-2">
            <p>
              The automated heuristic analysis examined <strong className="text-slate-900">{stats.totalLogs}</strong> total log entries. The transparent rule engine flagged <strong className="text-red-700">{stats.totalThreats} potential threat incidents</strong> across {Object.keys(stats.categoryCounts).length} distinct attack patterns.
            </p>
            <p>
              High-priority events include multiple failed authentication queries originating from single IP blocks within the 5-minute threshold window, as well as unauthorized requests to restricted web endpoints. Client-side detections are designed for educational demonstration and should be corroborated with real-time server IDS/IPS logs in production environments.
            </p>
          </div>
        </div>

        {/* Faculty Sign-off Section (Print-ready) */}
        <div className="pt-6 border-t border-gray-200 grid grid-cols-2 gap-8 text-xs text-gray-500">
          <div>
            <p className="font-semibold text-slate-800 mb-6">Student / Developer Signature:</p>
            <div className="border-b border-gray-300 w-48"></div>
            <p className="text-[11px] mt-1 text-gray-400">Date & Verification Stamp</p>
          </div>
          <div>
            <p className="font-semibold text-slate-800 mb-6">Evaluator / Faculty Signature:</p>
            <div className="border-b border-gray-300 w-48"></div>
            <p className="text-[11px] mt-1 text-gray-400">Department Grade & Remarks</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
