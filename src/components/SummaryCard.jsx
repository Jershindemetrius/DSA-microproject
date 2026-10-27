import React from 'react';
import PropTypes from 'prop-types';

function SummaryCard({ title, value, subtitle, icon: Icon, accent = 'blue' }) {
  const accentClasses = {
    blue: {
      border: 'border-l-4 border-l-blue-800',
      iconBg: 'bg-blue-50 text-blue-800',
    },
    red: {
      border: 'border-l-4 border-l-red-600',
      iconBg: 'bg-red-50 text-red-700',
    },
    orange: {
      border: 'border-l-4 border-l-amber-500',
      iconBg: 'bg-amber-50 text-amber-700',
    },
    green: {
      border: 'border-l-4 border-l-emerald-600',
      iconBg: 'bg-emerald-50 text-emerald-700',
    },
  }[accent] || {
    border: 'border-l-4 border-l-blue-800',
    iconBg: 'bg-blue-50 text-blue-800',
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 shadow-2xs hover:shadow-xs transition-shadow ${accentClasses.border}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
            {title}
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${accentClasses.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.elementType,
  accent: PropTypes.oneOf(['blue', 'red', 'orange', 'green']),
};

export default SummaryCard;
