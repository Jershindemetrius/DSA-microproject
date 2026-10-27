import React from 'react';
import PropTypes from 'prop-types';
import { XCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const severityMap = {
  critical: { color: 'bg-danger text-white', icon: XCircle },
  high: { color: 'bg-warning text-white', icon: AlertTriangle },
  medium: { color: 'bg-warning text-white', icon: AlertTriangle },
  low: { color: 'bg-success text-white', icon: CheckCircle },
  info: { color: 'bg-info text-white', icon: Info },
};

function SeverityBadge({ severity }) {
  const lower = severity.toLowerCase();
  const config = severityMap[lower] || severityMap.info;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded ${config.color} text-xs`}> 
      <Icon className="w-3 h-3 mr-1" /> {severity}
    </span>
  );
}

SeverityBadge.propTypes = {
  severity: PropTypes.string.isRequired,
};

export default SeverityBadge;
