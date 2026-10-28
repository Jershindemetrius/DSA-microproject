import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  RotateCcw, 
  Download,
  Calendar,
  Layers
} from 'lucide-react';
import { useLogs } from '../context/LogContext';
import LogTable from '../components/LogTable';

const SEVERITY_WEIGHTS = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

function Logs() {
  const { logs } = useLogs();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [flagFilter, setFlagFilter] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp-desc');

  // Dynamic filter lists
  const availableSeverities = useMemo(() => {
    return Array.from(new Set(logs.map(l => (l.severity || 'info').toLowerCase())));
  }, [logs]);

  const availableEventTypes = useMemo(() => {
    return Array.from(new Set(logs.map(l => (l.eventType || 'unknown').toLowerCase())));
  }, [logs]);

  // Filtered and sorted logs
  const processedLogs = useMemo(() => {
    return logs
      .filter(log => {
        // Search filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchIp = log.sourceIp?.toLowerCase().includes(q);
          const matchMsg = log.message?.toLowerCase().includes(q);
          const matchType = log.eventType?.toLowerCase().includes(q);
          const matchDetection = log.detection?.toLowerCase().includes(q);
          if (!matchIp && !matchMsg && !matchType && !matchDetection) return false;
        }

        // Severity filter
        if (severityFilter !== 'all' && log.severity?.toLowerCase() !== severityFilter) {
          return false;
        }

        // Event type filter
        if (eventTypeFilter !== 'all' && log.eventType?.toLowerCase() !== eventTypeFilter) {
          return false;
        }

        // Flagged filter
        if (flagFilter === 'threats-only' && (!log.flagged && log.detection === 'normal')) {
          return false;
        }
        if (flagFilter === 'safe-only' && (log.flagged || log.detection !== 'normal')) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'timestamp-desc') {
          return new Date(b.timestamp) - new Date(a.timestamp);
        }
        if (sortBy === 'timestamp-asc') {
          return new Date(a.timestamp) - new Date(b.timestamp);
        }
        if (sortBy === 'severity-desc') {
          return (SEVERITY_WEIGHTS[b.severity?.toLowerCase()] || 0) - (SEVERITY_WEIGHTS[a.severity?.toLowerCase()] || 0);
        }
        if (sortBy === 'severity-asc') {
          return (SEVERITY_WEIGHTS[a.severity?.toLowerCase()] || 0) - (SEVERITY_WEIGHTS[b.severity?.toLowerCase()] || 0);
        }
        return 0;
      });
  }, [logs, searchTerm, severityFilter, eventTypeFilter, flagFilter, sortBy]);

  const resetFilters = () => {
    setSearchTerm('');
    setSeverityFilter('all');
    setEventTypeFilter('all');
    setFlagFilter('all');
    setSortBy('timestamp-desc');
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-2xs p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 mb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Log Explorer & Query Console</h2>
            <p className="text-xs text-gray-500">Filter across IP addresses, threat flags, event categories, and severity levels</p>
          </div>
          <div className="text-xs text-gray-500 font-medium">
            Found <span className="font-bold text-blue-900">{processedLogs.length}</span> of {logs.length} entries
          </div>
        </div>

        {/* Filter Toolbar Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search IP, keywords, or event..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-white"
            />
          </div>

          {/* Severity Dropdown */}
          <div>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-white capitalize"
            >
              <option value="all">All Severities</option>
              {availableSeverities.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Event Type Dropdown */}
          <div>
            <select
              value={eventTypeFilter}
              onChange={e => setEventTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-white capitalize"
            >
              <option value="all">All Event Types</option>
              {availableEventTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Threat Flag Filter */}
          <div>
            <select
              value={flagFilter}
              onChange={e => setFlagFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-white"
            >
              <option value="all">All Records</option>
              <option value="threats-only">Threats Only</option>
              <option value="safe-only">Normal Traffic</option>
            </select>
          </div>
        </div>

        {/* Sort & Reset Bar */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-2 py-1 rounded border border-gray-200 bg-slate-50 text-slate-700 font-medium"
            >
              <option value="timestamp-desc">Timestamp (Newest First)</option>
              <option value="timestamp-asc">Timestamp (Oldest First)</option>
              <option value="severity-desc">Severity (Critical First)</option>
              <option value="severity-asc">Severity (Lowest First)</option>
            </select>
          </div>

          {(searchTerm || severityFilter !== 'all' || eventTypeFilter !== 'all' || flagFilter !== 'all' || sortBy !== 'timestamp-desc') && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Active Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <LogTable logs={processedLogs} pageSize={12} />
    </div>
  );
}

export default Logs;
