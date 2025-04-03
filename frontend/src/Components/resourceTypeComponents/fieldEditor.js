import React from 'react';
import { FiSquare,FiTrash2, FiChevronDown, FiHash, FiTag, FiList, FiLink, FiCode, FiCheckCircle } from 'react-icons/fi';
const FieldEditor = ({ index, field, onUpdate, onRemove, resourceType }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    onUpdate(index, {
      ...field,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleReferenceTypeChange = (e) => {
    onUpdate(index, {
      ...field,
      referenceType: e.target.value === '' ? null : e.target.value
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-700 flex items-center">
          <FiSquare className="mr-2 text-blue-400" />
          Field #{index + 1}
        </h3>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
        >
          <FiTrash2 />
        </button>
      </div>
  
      <div className="space-y-4">
        {/* First Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Field Name */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FiHash className="mr-1 text-gray-400" size={14} />
              Field Name*
            </label>
            <input
              type="text"
              name="fieldName"
              value={field.fieldName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
            />
          </div>
  
          {/* Display Name */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FiTag className="mr-1 text-gray-400" size={14} />
              Display Name
            </label>
            <input
              type="text"
              name="displayName"
              value={field.displayName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
  
          {/* Field Type */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FiList className="mr-1 text-gray-400" size={14} />
              Field Type*
            </label>
            <div className="relative">
              <select
                name="fieldType"
                value={field.fieldType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-all"
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="date">Date</option>
                <option value="array">Array</option>
                <option value="object">Object</option>
                <option value="reference">Reference</option>
              </select>
              <FiChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
  
        {/* Second Row - Conditional Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Reference Type (conditional) */}
          {field.fieldType === 'reference' && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <FiLink className="mr-1 text-gray-400" size={14} />
                Reference Type*
              </label>
              <select
                value={field.referenceType || ''}
                onChange={handleReferenceTypeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              >
                <option value="">Select a resource type</option>
                {resourceType.fieldDefinitions
                  .filter((f, i) => i !== index && f.fieldName)
                  .map((f) => (
                    <option key={f.fieldName} value={f.fieldName}>
                      {f.displayName || f.fieldName}
                    </option>
                  ))}
              </select>
            </div>
          )}
  
          {/* Default Value */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FiCode className="mr-1 text-gray-400" size={14} />
              Default Value
            </label>
            <input
              type={field.fieldType === 'number' ? 'number' : 'text'}
              name="defaultValue"
              value={field.defaultValue || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
  
          {/* Spacer to maintain grid layout */}
          <div></div>
        </div>
  
        {/* Third Row - Required Field */}
        <div className="flex items-center pt-2 border-t border-gray-100">
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`required-${index}`}
              name="required"
              checked={field.required}
              onChange={handleChange}
              className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={`required-${index}`} className="ml-2 block text-sm text-gray-700 flex items-center">
              <FiCheckCircle className="mr-1 text-gray-400" size={14} />
              Required Field
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldEditor;