import React, { useState } from 'react';
import { FiPlus, FiX, FiSave, FiTrash2, FiChevronDown } from 'react-icons/fi';
import FieldEditor from '../../Components/resourceTypeComponents/fieldEditor';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createResourceType } from '../../features/resourceTypeSlice';

const CreateResourceTypePage = ({ onCancel }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error, loading } = useSelector(state => state.resourceTypes);
  
  const [resourceType, setResourceType] = useState({
    name: '',
    icon: '',
    color: '#3b82f6',
    fieldDefinitions: []
  });

  const addField = () => {
    setResourceType(prev => ({
      ...prev,
      fieldDefinitions: [
        ...prev.fieldDefinitions,
        {
          fieldName: '',
          displayName: '',
          fieldType: 'string',
          required: false,
          defaultValue: ''
        }
      ]
    }));
  };

  const removeField = (index) => {
    setResourceType(prev => ({
      ...prev,
      fieldDefinitions: prev.fieldDefinitions.filter((_, i) => i !== index)
    }));
  };

  const updateField = (index, field) => {
    setResourceType(prev => {
      const newFields = [...prev.fieldDefinitions];
      newFields[index] = field;
      return { ...prev, fieldDefinitions: newFields };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createResourceType(resourceType)).unwrap();
      navigate('/resource-types');
    } catch (error) {
      // Error is already handled in the slice
    }
  };

  const handleCancel = () => {
    navigate('/resource-types');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Create New Resource Type</h1>
        <button 
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <FiX size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
            <input
              type="text"
              value={resourceType.name}
              onChange={(e) => setResourceType({...resourceType, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
            <input
              type="text"
              value={resourceType.icon}
              onChange={(e) => setResourceType({...resourceType, icon: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. FiTool for a tool icon"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex items-center">
              <input
                type="color"
                value={resourceType.color}
                onChange={(e) => setResourceType({...resourceType, color: e.target.value})}
                className="h-10 w-10 rounded cursor-pointer"
              />
              <span className="ml-2">{resourceType.color}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-800">Field Definitions</h2>
            <button
              type="button"
              onClick={addField}
              className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
            >
              <FiPlus className="mr-2" /> Add Field
            </button>
          </div>

          {resourceType.fieldDefinitions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No fields added yet. Click "Add Field" to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {resourceType.fieldDefinitions.map((field, index) => (
                <FieldEditor
                  key={index}
                  index={index}
                  field={field}
                  onUpdate={updateField}
                  onRemove={removeField}
                  resourceType={resourceType}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
          >
            <FiSave className="mr-2" /> Save Resource Type
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateResourceTypePage;