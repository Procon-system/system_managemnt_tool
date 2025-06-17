import React from 'react';

const ActionBar = ({ onAddCustomColumn }) => {
  const handleExport = () => {
    console.log('Exporting data...');
    alert('Export functionality would be implemented here');
  };

  const handleSaveView = () => {
    console.log('Saving view...');
    alert('Save view functionality would be implemented here');
  };

  return (
    <div className="flex gap-2">
      <button 
        onClick={handleSaveView}
        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Save View
      </button>
      <button 
        onClick={handleExport}
        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Export Data
      </button>
      <button 
        onClick={onAddCustomColumn}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        + Add Custom Column
      </button>
    </div>
  );
};

export default ActionBar;