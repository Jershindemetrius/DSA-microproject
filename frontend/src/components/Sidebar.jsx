import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileSearch, 
  ListFilter, 
  ShieldAlert, 
  FileText, 
  ShieldCheck, 
  X,
  Server
} from 'lucide-react';
import { useLogs } from '../context/LogContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/analyze', label: 'Analyze Logs', icon: FileSearch },
  { to: '/logs', label: 'Log Explorer', icon: ListFilter },
  { to: '/alerts', label: 'Threat Alerts', icon: ShieldAlert, showBadge: true },
  { to: '/reports', label: 'Reports', icon: FileText },
];

function Sidebar() {
  const { alerts, alertsLoading, mobileNavOpen, setMobileNavOpen } = useLogs();
  const unreviewedCount = alerts.filter(a => a.status !== 'resolved').length;

  const closeMobile = () => setMobileNavOpen(false);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileNavOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/40 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={closeMobile}
        />
      )}

      {/* Main Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 z-50 flex flex-col
        transition-transform duration-200 ease-in-out
        ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand / Logo Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-200 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
                CyberLog <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-300 font-mono">v1.0</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-tight">Threat Detector</p>
            </div>
          </div>
          {/* Close button for mobile */}
          <button 
            onClick={closeMobile} 
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-md"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Navigation
          </div>

          {navItems.map(({ to, label, icon: Icon, showBadge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={closeMobile}
              className={({ isActive }) => `
                flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                ${isActive 
                  ? 'bg-blue-50 text-blue-900 font-semibold border-l-4 border-blue-800 shadow-xs' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0 text-blue-700" />
                <span>{label}</span>
              </div>
              {showBadge && !alertsLoading && unreviewedCount > 0 && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                  {unreviewedCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Academic Project Info Box */}
        <div className="p-4 border-t border-gray-200 bg-gray-50/70 text-xs">
          <div className="flex items-center gap-2 mb-1.5 text-gray-700 font-medium">
            <Server className="w-3.5 h-3.5 text-blue-700" />
            <span>Academic Demonstration</span>
          </div>
          <p className="text-gray-500 text-[11px] leading-relaxed">
            Rule-Based Log Analyzer & Security Event Classification.
          </p>
          <div className="mt-2.5 pt-2 border-t border-gray-200/80 flex items-center justify-between text-[10px] text-gray-400">
            <span>Status: Ready</span>
            <span className="text-emerald-600 font-medium">● Backend API</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
