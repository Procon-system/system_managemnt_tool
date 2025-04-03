import React, { useState } from 'react';
import FieldEditor from '../../Components/resourceTypeComponents/fieldEditor';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createResourceType } from '../../features/resourceTypeSlice';
import IconExplorer from '../../Components/common/IconPicker'; // adjust the path as needed
import { FiChevronDown,FiX, FiPlus, FiSave } from 'react-icons/fi';
import * as FeatherIcons from 'react-icons/fi';
const CreateResourceTypePage = ({ onCancel }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

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
 <div className="relative bg-blue-50 p-4 rounded-lg shadow-sm border-gray-400 border-y-3 mb-6">
  {/* Half-circle left border */}
  <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-6 h-12 bg-gray-400 rounded-l-full"></div>
  
  {/* Half-circle right border */}
  <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-12 bg-gray-400 rounded-r-full"></div>

  <div className="relative flex justify-between items-center z-10">
    <h1 className="text-2xl font-bold text-gray-800 flex items-center">
      Create New Resource Type
    </h1>
    <button 
      onClick={handleCancel}
      className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1 hover:bg-gray-100 rounded-full"
    >
      <FiX size={24} />
    </button>
  </div>
</div>

  <form onSubmit={handleSubmit} className="space-y-6">
  <div className="flex flex-col md:flex-row gap-4 items-end">
  {/* Name and Icon in a flex container */}
  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Name Field */}
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">Name*</label>
      <input
        type="text"
        value={resourceType.name}
        onChange={(e) => setResourceType({...resourceType, name: e.target.value})}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        required
      />
    </div>

    {/* Icon Field */}
    <div className="space-y-1 relative">
      <label className="block text-sm font-medium text-gray-700">Icon</label>
      <button
        type="button"
        onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
        className="w-full flex items-center justify-between px-3 py-2 h-[42px] border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        {resourceType.icon ? (
          <div className="flex items-center">
            {React.createElement(FeatherIcons[resourceType.icon], { className: "mr-2", size: 20 })}
            <span className="truncate max-w-[120px]">{resourceType.icon}</span>
          </div>
        ) : (
          <span className="text-gray-400">Select an icon</span>
        )}
        <FiChevronDown className="ml-2" />
      </button>
      {isIconPickerOpen && (
        <div className="absolute z-10 mt-1 w-full">
          <IconExplorer 
            onSelect={(iconName) => {
              setResourceType({...resourceType, icon: iconName});
              setIsIconPickerOpen(false);
            }} 
          />
        </div>
      )}
    </div>
  </div>

  {/* Color Field - positioned at the end */}
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">Color</label>
    <div className="flex items-center h-[42px]">
      <input
        type="color"
        value={resourceType.color}
        onChange={(e) => setResourceType({...resourceType, color: e.target.value})}
        className="h-10 w-10 rounded cursor-pointer"
      />
      <span className="ml-2 text-sm">{resourceType.color}</span>
    </div>
  </div>
</div>

    {/* Rest of your form remains the same */}
    <div className="border-t border-gray-200 pt-6">
      <div className="flex justify-end mb-4">
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
        className="px-4 py-2 border border-gray-300 rounded-md text-white bg-red-500 hover:bg-red-600"
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