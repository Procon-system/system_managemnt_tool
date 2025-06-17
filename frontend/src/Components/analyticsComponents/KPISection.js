import React from 'react';

const KPISection = ({ kpiData }) => {
  const kpis = [
    {
      title: 'Total Tasks',
      value: kpiData.totalTasks,
      format: 'number',
      subtitle: 'Completed tasks',
      color: 'text-blue-600'
    },
    {
      title: 'Total Labor Cost',
      value: kpiData.totalLaborCost,
      format: 'currency',
      subtitle: 'All labor expenses',
      color: 'text-green-600'
    },
    {
      title: 'Total Hours',
      value: kpiData.totalHoursLogged,
      format: 'decimal',
      subtitle: 'Time logged',
      color: 'text-orange-600'
    },
    {
      title: 'Avg Duration',
      value: kpiData.averageTaskDuration,
      format: 'decimal',
      subtitle: 'Per task',
      color: 'text-purple-600'
    },
    {
      title: 'Resource Cost',
      value: kpiData.totalResourceCost,
      format: 'currency',
      subtitle: 'All resources',
      color: 'text-red-600'
    },
    {
      title: 'Items Produced',
      value: kpiData.totalItemsProduced,
      format: 'number',
      subtitle: 'Total output',
      color: 'text-indigo-600'
    }
  ];

  const formatValue = (value, format) => {
    if (typeof value !== 'number' || isNaN(value)) return '0';
    
    switch (format) {
      case 'currency':
        return `$${value.toFixed(2)}`;
      case 'decimal':
        return value.toFixed(2);
      case 'number':
      default:
        return value.toString();
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {kpis.map((kpi, index) => (
        <div key={index} className="bg-white p-4 rounded-lg shadow">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>
              {formatValue(kpi.value, kpi.format)}
            </p>
            <p className="text-xs text-gray-500">{kpi.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPISection;