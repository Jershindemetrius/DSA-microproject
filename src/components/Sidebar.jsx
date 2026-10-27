import { NavLink } from 'react-router-dom';
import { Home, List, FileText, AlertCircle, BarChart2 } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/analyze', label: 'Analyze Logs', icon: FileText },
  { to: '/logs', label: 'Log Explorer', icon: List },
  { to: '/alerts', label: 'Threat Alerts', icon: AlertCircle },
  { to: '/reports', label: 'Reports', icon: BarChart2 },
];

function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-4 hidden md:block">
      <nav className="space-y-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center space-x-2 p-2 rounded hover:bg-gray-100 ${isActive ? 'bg-gray-100 font-medium' : ''}`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
