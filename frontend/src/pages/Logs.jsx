import React, { useEffect, useState } from 'react';
import { ArrowUpDown, Calendar, RotateCcw, Search } from 'lucide-react';
import LogTable from '../components/LogTable';
import { deleteLog, fetchLogRecords } from '../services/api';

const PAGE_SIZE = 20;

function normalizeLog(log) {
  return {
    ...log,
    sourceIp: log.source_ip || '—',
    eventType: log.event_type,
    authResult: log.auth_result,
  };
}

function Logs() {
  const [filters, setFilters] = useState({
    search: '',
    source_ip: '',
    username: '',
    severity: '',
    event_type: '',
    start_date: '',
    end_date: '',
    sort_by: 'timestamp',
    sort_order: 'desc',
  });
  const [pageNumber, setPageNumber] = useState(1);
  const [result, setResult] = useState({ items: [], total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      const params = {
        page: pageNumber,
        size: PAGE_SIZE,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
      };
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      if (params.start_date) params.start_date = new Date(params.start_date).toISOString();
      if (params.end_date) params.end_date = new Date(params.end_date).toISOString();

      try {
        const response = await fetchLogRecords(params, { signal: controller.signal });
        setResult({
          items: response.items.map(normalizeLog),
          total: response.total,
          pages: response.pages,
        });
      } catch (requestError) {
        if (!controller.signal.aborted) setError(requestError.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [filters, pageNumber, reload]);

  const changeFilter = (key, value) => {
    setPageNumber(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setPageNumber(1);
    setFilters({
      search: '',
      source_ip: '',
      username: '',
      severity: '',
      event_type: '',
      start_date: '',
      end_date: '',
      sort_by: 'timestamp',
      sort_order: 'desc',
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteLog(id);
      setReload((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-lg border border-gray-200 shadow-2xs p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 mb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Log Explorer & Query Console</h2>
            <p className="text-xs text-gray-500">Search and filter stored records through the backend.</p>
          </div>
          {!loading && (
            <div className="text-xs text-gray-500 font-medium">
              Showing <span className="font-bold text-blue-900">{result.items.length}</span> of {result.total} records
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <label className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="search"
              placeholder="Search message, IP, or username"
              value={filters.search}
              onChange={(event) => changeFilter('search', event.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
            />
          </label>
          <input
            value={filters.source_ip}
            onChange={(event) => changeFilter('source_ip', event.target.value)}
            placeholder="Source IP"
            aria-label="Filter by source IP"
            className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white"
          />
          <input
            value={filters.username}
            onChange={(event) => changeFilter('username', event.target.value)}
            placeholder="Username"
            aria-label="Filter by username"
            className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white"
          />
          <select
            value={filters.severity}
            onChange={(event) => changeFilter('severity', event.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white capitalize"
          >
            <option value="">All Severities</option>
            {['critical', 'high', 'medium', 'low', 'info'].map((severity) => (
              <option key={severity} value={severity}>{severity}</option>
            ))}
          </select>
          <input
            value={filters.event_type}
            onChange={(event) => changeFilter('event_type', event.target.value)}
            placeholder="Event type"
            aria-label="Filter by event type"
            className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white"
          />
          <label className="flex items-center gap-2 text-gray-500">
            <Calendar className="w-4 h-4 shrink-0" />
            <input
              type="datetime-local"
              aria-label="Start date and time"
              value={filters.start_date}
              onChange={(event) => changeFilter('start_date', event.target.value)}
              className="min-w-0 w-full px-2 py-2 rounded-md border border-gray-300 bg-white"
            />
          </label>
          <label className="flex items-center gap-2 text-gray-500">
            <Calendar className="w-4 h-4 shrink-0" />
            <input
              type="datetime-local"
              aria-label="End date and time"
              value={filters.end_date}
              onChange={(event) => changeFilter('end_date', event.target.value)}
              className="min-w-0 w-full px-2 py-2 rounded-md border border-gray-300 bg-white"
            />
          </label>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">Sort by:</span>
            <select
              value={`${filters.sort_by}-${filters.sort_order}`}
              onChange={(event) => {
                const [sort_by, sort_order] = event.target.value.split('-');
                setFilters((current) => ({ ...current, sort_by, sort_order }));
                setPageNumber(1);
              }}
              className="px-2 py-1 rounded border border-gray-200 bg-slate-50 text-slate-700 font-medium"
            >
              <option value="timestamp-desc">Timestamp (Newest First)</option>
              <option value="timestamp-asc">Timestamp (Oldest First)</option>
              <option value="severity-desc">Severity (Descending)</option>
              <option value="severity-asc">Severity (Ascending)</option>
            </select>
          </div>
          <button onClick={resetFilters} className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 hover:underline">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </section>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
          <button onClick={() => setReload((value) => value + 1)} className="ml-3 font-semibold underline">Retry</button>
        </div>
      )}
      {loading ? (
        <p className="py-8 text-center text-sm text-gray-500">Loading log records…</p>
      ) : (
        <>
          <LogTable logs={result.items} showPagination={false} onDelete={handleDelete} />
          {result.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-600">
              <span>Page {pageNumber} of {result.pages} · {result.total} records</span>
              <div className="flex gap-2">
                <button
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber((current) => current - 1)}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={pageNumber >= result.pages}
                  onClick={() => setPageNumber((current) => current + 1)}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Logs;
