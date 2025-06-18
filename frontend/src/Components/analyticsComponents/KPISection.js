// src/Components/analyticsComponents/KPISection.js (Updated)

import React from 'react';

// The component now receives the fully-formed `kpis` array as a prop.
const KPISection = ({ kpis = [] }) => {

  const formatValue = (value, format) => {
    if (typeof value !== 'number' || isNaN(value)) {
        // For currency, show $0.00, otherwise 0
        return format === 'currency' ? '$0.00' : '0';
    }
    
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'decimal':
        return value.toFixed(2);
      case 'number':
      default:
        return value.toLocaleString();
    }
  };

  if (!kpis || kpis.length === 0) {
      return null; // Don't render anything if there are no KPIs to show
  }

  return (
    // Responsive grid that adapts to the number of KPIs
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {/* It simply maps over the kpis prop */}
      {kpis.map((kpi, index) => (
        <div key={index} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="flex flex-col h-full">
            <p className="text-sm font-medium text-gray-500 truncate" title={kpi.title}>{kpi.title}</p>
            <p className={`text-2xl lg:text-3xl font-bold my-1 ${kpi.color}`}>
              {formatValue(kpi.value, kpi.format)}
            </p>
            <p className="text-xs text-gray-500 mt-auto">{kpi.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPISection;