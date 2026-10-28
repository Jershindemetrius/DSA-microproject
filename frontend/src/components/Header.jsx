import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Shield, FileCode, LogOut } from 'lucide-react';
import { useLogs } from '../context/LogContext';

const pageMeta = {
  '/': { title: 'Security Dashboard', desc: 'Real-time overview of parsed server logs and threat detection metrics' },
  '/analyze': { title: 'Analyze Log Files', desc: 'Upload .log or .txt files and run the transparent heuristic detection engine' },
  '/logs': { title: 'Log Explorer', desc: 'Search, filter, inspect, and drill down into all processed security events' },
  '/alerts': { title: 'Threat Alerts', desc: 'Review detected anomalies, audit incident reasons, and update review statuses' },
  '/reports': { title: 'Analysis Reports', desc: 'Generate printable evaluation summaries and export log records as CSV' },
};

function Header() {
  const location = useLocation();
  const { activeFileName, setMobileNavOpen, user, logout } = useLogs();
  const current = pageMeta[location.pathname] || pageMeta['/'];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 md:px-6 py-3 shadow-2xs">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileNavOpen(prev => !prev)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
                {current.title}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
                <FileCode className="w-3 h-3 text-blue-700" />
                {activeFileName || 'No upload selected'}
              </span>
            </div>
            <p className="hidden md:block text-xs text-gray-500 mt-0.5">
              {current.desc}
            </p>
          </div>
        </div>

        {/* Right: Authenticated user and session controls */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="hidden sm:inline">{user?.username}</span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-gray-300 text-xs text-slate-700 hover:bg-slate-50"
            aria-label="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
