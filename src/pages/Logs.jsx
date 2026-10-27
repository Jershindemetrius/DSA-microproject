import React, { useEffect, useState } from 'react';
import { fetchLogRecords } from '../services/api';
import LogTable from '../components/LogTable';
import SeverityBadge from '../components/SeverityBadge';
import { Search, Filter } from 'lucide-react';

function Logs() {
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');

  useEffect(() => {
    fetchLogRecords().then(({ data }) => {
      setLogs(data);
      setFiltered(data);
    });
  }, []);

  useEffect(() => {
    let result = logs;
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(l =>
        (l.sourceIp && l.sourceIp.toLowerCase().includes(term)) ||
        (l.message && l.message.toLowerCase().includes(term)) ||
        (l.eventType && l.eventType.toLowerCase().includes(term))
      );
    }
    if (severityFilter) {
      result = result.filter(l => l.severity && l.severity.toLowerCase() === severityFilter);
    }
    if (eventFilter) {
      result = result.filter(l => l.eventType && l.eventType.toLowerCase() === eventFilter);
    }
    setFiltered(result);
  }, [search, severityFilter, eventFilter, logs]);

  const uniqueSeverities = Array.from(new Set(logs.map(l => l.severity?.toLowerCase()).filter(Boolean)));
  const uniqueEvents = Array.from(new Set(logs.map(l => l.eventType?.toLowerCase()).filter(Boolean)));

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-primary">Log Explorer</h2>
      <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search IP, message, or event"
            className="border rounded px-2 py-1"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            className="border rounded px-2 py-1"
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
          >
            <option value="">All Severities</option>
            {uniqueSeverities.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            className="border rounded px-2 py-1"
            value={eventFilter}
            onChange={e => setEventFilter(e.target.value)}
          >
            <option value="">All Event Types</option>
            {uniqueEvents.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
      </div>
      <LogTable logs={filtered} />
    </div>
  );
}

export default Logs;
