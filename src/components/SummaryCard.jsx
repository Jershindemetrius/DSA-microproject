import React from 'react';
import PropTypes from 'prop-types';

function SummaryCard({ title, value, icon: Icon, color }) {
  return (
    <div className={`flex items-center p-4 bg-white rounded shadow ${color}`}>
      {Icon && <Icon className="w-6 h-6 mr-3" />}
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType,
  color: PropTypes.string,
};

export default SummaryCard;
