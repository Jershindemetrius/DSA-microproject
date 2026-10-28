import React, { useState } from 'react';
import PropTypes from 'prop-types';
import SeverityBadge from './SeverityBadge';
import { Eye, X, Terminal, ShieldAlert, CheckCircle, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

function LogTable({ logs = [], pageSize = 10, showPagination = true, onDelete }) {
  const [selectedLog, setSelectedLog] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(logs.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const currentLogs = showPagination ? logs.slice(startIndex, startIndex + pageSize) : logs;

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-3.5 py-3">Timestamp</th>
                <th scope="col" className="px-3.5 py-3">Source IP</th>
                <th scope="col" className="px-3.5 py-3">Event Type</th>
                <th scope="col" className="px-3.5 py-3">Log Message</th>
                <th scope="col" className="px-3.5 py-3">Severity</th>
                <th scope="col" className="px-3.5 py-3">Detection</th>
                <th scope="col" className="px-3.5 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white font-mono">
              {currentLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center font-sans text-gray-500">
                    No log records match the selected criteria.
                  </td>
                </tr>
              ) : (
                currentLogs.map((log, idx) => {
                  const isFlagged = log.flagged || (log.detection && log.detection !== 'normal' && log.detection !== 'none');
                  return (
                    <tr 
                      key={log.id || idx} 
                      className={`hover:bg-slate-50/80 transition-colors ${isFlagged ? 'bg-red-50/20' : ''}`}
                    >
                      <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-600">
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap font-medium text-slate-900">
                        {log.sourceIp}
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap font-sans">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {log.eventType}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 font-sans text-slate-700 max-w-xs md:max-w-md truncate" title={log.message}>
                        {log.message}
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap font-sans">
                        <SeverityBadge severity={log.severity || 'info'} />
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap font-sans">
                        {isFlagged ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            <ShieldAlert className="w-3 h-3" />
                            {log.detection}
                          </span>
                        ) : log.detection ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            Normal
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-500">Not analyzed</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap text-right font-sans">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900 hover:underline px-2 py-1 rounded bg-blue-50/50 hover:bg-blue-50"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                        {onDelete && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete log record ${log.id}? This cannot be undone.`)) {
                                onDelete(log.id);
                              }
                            }}
                            className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-900 hover:underline px-2 py-1 rounded bg-red-50/60 hover:bg-red-50"
                            aria-label={`Delete log ${log.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {showPagination && logs.length > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-gray-200 text-xs text-gray-600">
            <div>
              Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{' '}
              <span className="font-semibold text-gray-900">
                {Math.min(startIndex + pageSize, logs.length)}
              </span>{' '}
              of <span className="font-semibold text-gray-900">{logs.length}</span> events
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <span className="px-2 font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg border border-gray-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-sm">Security Log Entry Details</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-white rounded-md p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-2.5 rounded border border-gray-200">
                  <span className="text-gray-500 block text-[11px] font-medium">Timestamp</span>
                  <span className="font-mono text-slate-800 font-semibold">{new Date(selectedLog.timestamp).toISOString()}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-gray-200">
                  <span className="text-gray-500 block text-[11px] font-medium">Source IP</span>
                  <span className="font-mono text-slate-800 font-semibold">{selectedLog.sourceIp}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-gray-200">
                  <span className="text-gray-500 block text-[11px] font-medium">Event Type</span>
                  <span className="text-slate-800 font-semibold uppercase">{selectedLog.eventType}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-gray-200">
                  <span className="text-gray-500 block text-[11px] font-medium">Assigned Severity</span>
                  <div className="mt-0.5"><SeverityBadge severity={selectedLog.severity || 'info'} /></div>
                </div>
              </div>

              <div>
                <span className="text-gray-600 block text-[11px] font-medium mb-1">Full Message Content</span>
                <div className="p-3 bg-slate-950 text-slate-200 font-mono text-[11px] rounded-md border border-slate-800 wrap-break-word leading-relaxed">
                  {selectedLog.message}
                </div>
              </div>

              {selectedLog.authResult && (
                <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-slate-800">
                  Authentication result: <strong>{selectedLog.authResult}</strong>
                </div>
              )}

              {selectedLog.detection && selectedLog.detection !== 'normal' && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-800">
                  <div className="flex items-center gap-1.5 font-semibold mb-1">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>Rule Trigger: {selectedLog.detection}</span>
                  </div>
                  <p className="text-[11px] text-red-700 leading-normal">
                    This log record matched one of the active heuristic detection rules for potential anomalous or malicious behavior.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end px-5 py-3 border-t border-gray-200 bg-slate-50">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-md text-xs font-medium bg-slate-800 text-white hover:bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

LogTable.propTypes = {
  logs: PropTypes.arrayOf(PropTypes.object),
  pageSize: PropTypes.number,
  showPagination: PropTypes.bool,
  onDelete: PropTypes.func,
};

export default LogTable;
