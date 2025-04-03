import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import DynamicFormField from './dynamicFormField';
import {SelectInput,SelectTaskPeriodInput} from './selectInput';
import RichTextEditor from './richTextEditor';

const TaskForm = ({ onSubmit, initialData = {}, resourceTypes }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState(initialData);
  const [loadingOptions, setLoadingOptions] = useState({});

  // Categorize resources by type
  const categorizedResources = resourceTypes?.reduce((acc, type) => {
    const category = type.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(type);
    return acc;
  }, {});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleResourceSelect = (resourceType, selectedResources) => {
    setFormData(prev => ({
      ...prev,
      [resourceType.fieldName]: selectedResources
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 mt-7 md:px-6 bg-blue-50 shadow-md rounded-md max-w-full lg:max-w-6xl lg:mr-4">
      <h1 className="text-xl font-bold text-center flex justify-center mb-6">
        Create Task
      </h1>

      {/* Basic Task Info */}
      <div className="space-y-4">
  {/* First Row - Title and Assigned To (2 cols) */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <DynamicFormField
        field={{
          fieldName: 'title',
          displayName: 'Title',
          fieldType: 'text',
          required: true
        }}
        value={formData.title}
        onChange={handleChange}
      />
    </div>
    <div>
      <SelectInput
        label="Assign To"
        name="assigned_to"
        value={formData.assigned_to}
        onChange={handleChange}
        isMulti
        required
      />
    </div>
  </div>

  {/* Second Row - Start and End Times (2 cols) */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <DynamicFormField
        field={{
          fieldName: 'start_time',
          displayName: 'Start Time',
          fieldType: 'datetime',
          required: true
        }}
        value={formData.start_time}
        onChange={handleChange}
      />
    </div>
    <div>
      <DynamicFormField
        field={{
          fieldName: 'end_time',
          displayName: 'End Time',
          fieldType: 'datetime',
          required: true
        }}
        value={formData.end_time}
        onChange={handleChange}
      />
    </div>
  </div>

  {/* Third Row - The remaining three fields (3 cols) */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div>
      <SelectTaskPeriodInput
        label="Task Period"
        name="task_period"
        value={formData.task_period}
        onChange={handleChange}
        required
      />
    </div>
    <div>
      <SelectInput
        label="Frequency"
        name="repeat_frequency"
        value={formData.repeat_frequency}
        onChange={handleChange}   
        options={[
          { label: 'None', value: 'none' },
          { label: 'Daily', value: 'daily' },
          { label: 'Weekly', value: 'weekly' },
          { label: 'Monthly', value: 'monthly' },
          { label: 'Yearly', value: 'yearly' },
        ]}
        required
      />
    </div>
    <div>
      <SelectInput
        label="Status"
        name="status"
        value={formData.status}
        onChange={handleChange}
        options={[
          { label: 'Pending', value: 'pending' },
          { label: 'In Progress', value: 'in progress' },
          { label: 'Done', value: 'done' },
          { label: 'Overdue', value: 'overdue' },
        ]}
      />
    </div>
  </div>
</div>

      {/* Resource Selection */}
      {categorizedResources && Object.entries(categorizedResources).map(([category, resources]) => (
        <div key={category} className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map(resourceType => (
              <div key={resourceType._id} className="border rounded-lg p-4">
                <DynamicFormField
                  field={{
                    fieldName: `resources.${resourceType._id}`,
                    displayName: resourceType.name,
                    fieldType: 'select',
                    multiple: true,
                    options: resourceType.availableResources?.map(res => ({
                      label: res.name,
                      value: res._id
                    })) || []
                  }}
                  value={formData.resources?.[resourceType._id] || []}
                  onChange={(e) => handleResourceSelect(resourceType, e.target.value)}
                />
                {resourceType.description && (
                  <p className="text-sm text-gray-500 mt-2">{resourceType.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
 <div className="mt-6">
      <label className="block mb-1 text-sm font-medium text-gray-600">Notes</label>
      <RichTextEditor value={formData.notes} onChange={handleChange} />
    </div>
      <button
        type="submit"
        className="w-full px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
      >
        Create Task
      </button>
    </form>
  );
};

export default TaskForm;