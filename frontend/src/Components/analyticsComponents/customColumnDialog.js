
import React, { useState } from 'react';
import { FiPlusCircle} from 'react-icons/fi';

const CustomColumnDialog = ({ onClose, onAdd, availableColumns = [] }) => {
  const [columnName, setColumnName] = useState('');
  const [formula, setFormula] = useState('');
  const calculableFields = availableColumns.filter(
    col => col.isNumeric || col.isCurrency
  );

  // Simplified examples that use keys guaranteed to exist from our hook.
  const exampleFormulas = [
    { name: 'Cost per Minute', formula: 'totalLaborCost / totalLoggedMinutes' },
    { name: 'Cost per Hour', formula: '(totalLaborCost * 60) / totalLoggedMinutes' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (columnName && formula) {
      // The key for the new column will be a sanitized version of its name
      const key = columnName.replace(/\s+/g, '_').toLowerCase();
      onAdd({ name: columnName, key: key, formula });
    }
  };

  const insertField = (fieldKey) => {
    setFormula(prev => prev ? `${prev} ${fieldKey}` : fieldKey);
  };

  const applyExample = (example) => {
    setColumnName(example.name);
    setFormula(example.formula);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FiPlusCircle className="mr-3 text-blue-500"/>
            Add Custom Calculated Column
          </h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800 text-3xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Column Name</label>
            <input
              type="text"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Total Project Cost"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Formula</label>
            <textarea
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="e.g., totalLaborCost + cost_someResourceId"
              rows="3"
              required
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border">
            <label className="block text-sm font-medium text-gray-700 mb-2">Available Fields (click to insert)</label>
            <div className="flex flex-wrap gap-2">
              {calculableFields.map(field => (
                <button
                  key={field.key}
                  type="button"
                  onClick={() => insertField(field.key)}
                  className="px-3 py-1 text-xs font-medium border border-gray-300 rounded-full bg-white hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-colors"
                  title={`Click to add '${field.key}' to formula`}
                >
                  {field.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Example Formulas</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {exampleFormulas.map((example, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50" onClick={() => applyExample(example)}>
                  <p className="font-medium text-sm text-gray-800">{example.name}</p>
                  <p className="text-xs text-gray-600 font-mono bg-gray-100 p-2 rounded mt-1">{example.formula}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-5 border-t">
            <button type="button" onClick={onClose} className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={!columnName || !formula} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400">Add Column</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomColumnDialog;