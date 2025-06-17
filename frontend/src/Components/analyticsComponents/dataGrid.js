import React, { useState } from 'react';

const DataGrid = ({ tasks, onRefresh }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [columnFilters, setColumnFilters] = useState({});

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleColumnFilter = (column, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const getSortedAndFilteredTasks = () => {
    let filteredTasks = tasks;

    // Apply column filters
    Object.entries(columnFilters).forEach(([column, filterValue]) => {
      if (filterValue) {
        filteredTasks = filteredTasks.filter(task => {
          const value = task[column];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(filterValue.toLowerCase());
          }
          return value.toString().includes(filterValue);
        });
      }
    });

    // Apply sorting
    if (sortConfig.key) {
      filteredTasks.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredTasks;
  };

  const columns = [
    { key: 'title', label: 'Task Title', width: 'w-64' },
    { key: 'completedOn', label: 'Completed On', width: 'w-32' },
    { key: 'assignedUser', label: 'Assigned User', width: 'w-32' },
    { key: 'userRate', label: 'User Rate ($/hr)', width: 'w-32' },
    { key: 'loggedTimeMinutes', label: 'Time (min)', width: 'w-24' },
    { key: 'laborCost', label: 'Labor Cost ($)', width: 'w-28' },
    { key: 'resourceUsed', label: 'Resource Used', width: 'w-40' },
    { key: 'resourceQty', label: 'Resource Qty', width: 'w-28' },
    { key: 'totalResourceCost', label: 'Resource Cost ($)', width: 'w-32' },
    { key: 'itemsProduced', label: 'Items Produced', width: 'w-28' },
    { key: 'costPerItem', label: 'Cost/Item ($)', width: 'w-28' }
  ];

  const sortedTasks = getSortedAndFilteredTasks();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${column.width}`}
                onClick={() => handleSort(column.key)}
              >
                <div className="flex items-center justify-between">
                  <span>{column.label}</span>
                  <div className="flex flex-col">
                    <span className={`text-xs ${sortConfig.key === column.key && sortConfig.direction === 'asc' ? 'text-blue-500' : 'text-gray-400'}`}>▲</span>
                    <span className={`text-xs ${sortConfig.key === column.key && sortConfig.direction === 'desc' ? 'text-blue-500' : 'text-gray-400'}`}>▼</span>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Filter..."
                  className="mt-1 block w-full text-xs border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => handleColumnFilter(column.key, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedTasks.map((task, index) => (
            <tr key={task.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {typeof task[column.key] === 'number' && column.key.includes('Cost') 
                    ? `$${task[column.key].toFixed(2)}`
                    : task[column.key]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {sortedTasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No tasks found matching the current filters.
        </div>
      )}
    </div>
  );
};

export default DataGrid;