import React, { useEffect, useState } from 'react';
import { fetchReport, fetchLogRecords } from '../services/api';
import { Download, Printer } from 'lucide-react';

function Reports() {
  const [report, setReport] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Load report and logs (for CSV export)
    fetchReport().then(({ data }) => setReport(data));
    fetchLogRecords().then(({ data }) => setLogs(data));
  }, []);

  const exportCsv = () => {
    const header = ['Timestamp', 'Source IP', 'Event Type', 'Message', 'Severity', 'Detection'];
    const rows = logs.map(l => [
      l.timestamp,
      l.sourceIp,
      l.eventType,
      l.message,
      l.severity,
      l.detection || ''
    ]);
    const csvContent = [header, ...rows]
      .map(e => e.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'log_records.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    window.print();
  };

  if (!report) {
    return <div className="flex items-center justify-center h-64">Loading report...</div>;
  }

  return (
    <div className="space-y-6 p-4 bg-gray-50">
      <h2 className="text-2xl font-semibold text-primary">Analysis Report</h2>
      <div className="bg-white p-4 rounded shadow">
        <p><strong>Date:</strong> {new Date(report.analysisDate).toLocaleString()}</p>
        <p><strong>Total Logs Processed:</strong> {report.totalLogs}</p>
        <p><strong>Threat Counts by Severity:</strong></p>
        <ul className="list-disc ml-6">
          {Object.entries(report.threatCounts).map(([sev, cnt]) => (
            <li key={sev}>{sev}: {cnt}</li>
          ))}
        </ul>
        <p><strong>Detected Threat Categories:</strong> {report.categories.join(', ')}</p>
        <p><strong>Suspicious Source IPs:</strong> {report.suspiciousIps.join(', ')}</p>
        <p><strong>Summary:</strong> {report.summary}</p>
      </div>
      <div className="flex space-x-4">
        <button onClick={exportCsv} className="flex items-center px-4 py-2 bg-primary text-white rounded hover:bg-primary/80">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </button>
        <button onClick={printReport} className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
          <Printer className="w-4 h-4 mr-2" /> Print Report
        </button>
      </div>
    </div>
  );
}

export default Reports;
