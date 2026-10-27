import { useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const pageTitles = {
  '/': 'Dashboard',
  '/analyze': 'Analyze Logs',
  '/logs': 'Log Explorer',
  '/alerts': 'Threat Alerts',
  '/reports': 'Reports',
};

function Header() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Dashboard';
  return (
    <header className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-2 shadow-sm">
      <h1 className="text-xl font-semibold text-primary">Intelligent Cybersecurity Log Analyzer</h1>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">{title}</span>
        {/* Simple system status indicator */}
        <AlertTriangle className="w-5 h-5 text-success" title="System operational" />
      </div>
    </header>
  );
}

export default Header;
