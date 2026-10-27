import React from 'react';
import PropTypes from 'prop-types';
import SeverityBadge from './SeverityBadge';

function LogTable({ logs }) {
  return (
    <div className="overflow-auto bg-white rounded shadow">
      <table className="min-w-full table-auto">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-2 py-1 text-left text-sm">Timestamp</th>
            <th className="px-2 py-1 text-left text-sm">Source IP</th>
            <th className="px-2 py-1 text-left text-sm">Event Type</th>
            <th className="px-2 py-1 text-left text-sm">Message</th>
            <th className="px-2 py-1 text-left text-sm">Severity</th>
            <th className="px-2 py-1 text-left text-sm">Detection</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => (
            <tr key={idx} className="border-t">
              <td className="px-2 py-1 text-sm">{new Date(log.timestamp).toLocaleString()}</td>
              <td className="px-2 py-1 text-sm">{log.sourceIp}</td>
              <td className="px-2 py-1 text-sm">{log.eventType}</td>
              <td className="px-2 py-1 text-sm">{log.message}</td>
              <td className="px-2 py-1 text-sm"><SeverityBadge severity={log.severity || 'info'} /></td>
              <td className="px-2 py-1 text-sm">{log.detection || 'none'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

LogTable.propTypes = {
  logs: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default LogTable;
