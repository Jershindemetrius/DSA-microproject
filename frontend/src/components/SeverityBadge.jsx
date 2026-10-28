import React from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const severityConfig = {
  critical: {
    bg: 'bg-red-50 text-red-700 border-red-200',
    icon: AlertCircle,
    label: 'Critical',
    dot: 'bg-red-500'
  },
  high: {
    bg: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: AlertTriangle,
    label: 'High',
    dot: 'bg-orange-500'
  },
  medium: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: AlertTriangle,
    label: 'Medium',
    dot: 'bg-amber-500'
  },
  low: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
    label: 'Low',
    dot: 'bg-emerald-500'
  },
  safe: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
    label: 'Safe',
    dot: 'bg-emerald-500'
  },
  info: {
    bg: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: Info,
    label: 'Info',
    dot: 'bg-gray-400'
  }
};

function SeverityBadge({ severity = 'info' }) {
  const key = (severity || 'info').toLowerCase();
  const config = severityConfig[key] || severityConfig.info;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${config.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
}

SeverityBadge.propTypes = {
  severity: PropTypes.string,
};

export default SeverityBadge;
