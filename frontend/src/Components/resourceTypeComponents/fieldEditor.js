import React from 'react';
import { FiTrash2, FiChevronDown } from 'react-icons/fi';

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
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-700">Field #{index + 1}</h3>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-red-500 hover:text-red-700"
        >
          <FiTrash2 />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Field Name*</label>
          <input
            type="text"
            name="fieldName"
            value={field.fieldName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
          <input
            type="text"
            name="displayName"
            value={field.displayName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Field Type*</label>
          <div className="relative">
            <select
              name="fieldType"
              value={field.fieldType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="date">Date</option>
              <option value="array">Array</option>
              <option value="object">Object</option>
              <option value="reference">Reference</option>
            </select>
            <FiChevronDown className="absolute right-3 top-3 text-gray-400" />
          </div>
        </div>

        {field.fieldType === 'reference' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference Type*</label>
            <select
              value={field.referenceType || ''}
              onChange={handleReferenceTypeChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

        <div className="flex items-center">
          <input
            type="checkbox"
            id={`required-${index}`}
            name="required"
            checked={field.required}
            onChange={handleChange}
            className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor={`required-${index}`} className="ml-2 block text-sm text-gray-700">
            Required Field
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default Value</label>
          <input
            type={field.fieldType === 'number' ? 'number' : 'text'}
            name="defaultValue"
            value={field.defaultValue || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default FieldEditor;