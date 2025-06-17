import React, { useState } from 'react';

const CustomColumnDialog = ({ onClose, onAdd }) => {
  const [columnName, setColumnName] = useState('');
  const [formula, setFormula] = useState('');

  const availableFields = [
    'laborCost', 'totalResourceCost', 'userRate', 'loggedTimeMinutes', 
    'resourceQty', 'itemsProduced', 'resourceCost', 'costPerItem'
  ];

  const exampleFormulas = [
    { name: 'Total Cost', formula: 'laborCost + (resourceQty * resourceCost)' },
    { name: 'Hourly Rate', formula: 'laborCost / (loggedTimeMinutes / 60)' },
    { name: 'Efficiency', formula: 'itemsProduced / (loggedTimeMinutes / 60)' },
    { name: 'Profit Margin', formula: '(itemsProduced * 5) - (laborCost + (resourceQty * resourceCost))' },
    { name: 'Cost Per Hour', formula: '(laborCost + totalResourceCost) / (loggedTimeMinutes / 60)' },
    { name: 'Resource Utilization', formula: 'resourceQty / itemsProduced' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (columnName && formula) {
      onAdd({ name: columnName, formula });
      setColumnName('');
      setFormula('');
    }
  };

  const insertField = (field) => {
    setFormula(prev => prev + field);
  };

  const applyExample = (example) => {
    setColumnName(example.name);
    setFormula(example.formula);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Add Custom Column</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Column Name
            </label>
            <input
              type="text"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Total Cost"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formula
            </label>
            <textarea
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., laborCost + (resourceQty * resourceCost)"
              rows="4"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Available Fields (click to insert)
            </label>
            <div className="flex flex-wrap gap-2">
              {availableFields.map(field => (
                <button
                  key={field}
                  type="button"
                  onClick={() => insertField(field)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                >
                  {field}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Example Formulas (click to use)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {exampleFormulas.map((example, index) => (
                <div
                  key={index}
                  className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  onClick={() => applyExample(example)}
                >
                  <div className="font-medium text-sm text-gray-900 mb-1">
                    {example.name}
                  </div>
                  <div className="text-xs text-gray-600 font-mono bg-gray-100 p-2 rounded">
                    {example.formula}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!columnName || !formula}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Add Column
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomColumnDialog;
