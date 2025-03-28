import { useForm } from 'react-hook-form';
// import { createResource } from '../redux/slices/resourceSlice';
import { useDispatch } from 'react-redux';
import React, { useState } from 'react';
const DynamicResourceForm = ({ resourceType, onCancel, onSuccess }) => {
  const dispatch = useDispatch();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    // try {
    //   await dispatch(createResource({
    //     typeId: resourceType._id,
    //     data
    //   })).unwrap();
    //   onSuccess();
    // } finally {
    //   setIsSubmitting(false);
    // }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Add New {resourceType.name}</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name field (common for all resources) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name*
            </label>
            <input
              type="text"
              {...register('name', { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.name && <span className="text-red-500 text-sm">This field is required</span>}
          </div>

          {/* Dynamic fields based on resource type */}
          {resourceType.fieldDefinitions.map((field) => (
            <div key={field.fieldName}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.displayName || field.fieldName}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              {renderFieldInput(field, register)}
              {errors[field.fieldName] && (
                <span className="text-red-500 text-sm">This field is required</span>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 flex items-center"
          >
            {isSubmitting ? 'Saving...' : 'Save Resource'}
          </button>
        </div>
      </form>
    </div>
  );
};

const renderFieldInput = (field, register) => {
  const validation = {
    required: field.required ? 'This field is required' : false
  };

  switch(field.fieldType) {
    case 'string':
      return (
        <input
          type="text"
          {...register(field.fieldName, validation)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          defaultValue={field.defaultValue}
        />
      );
    case 'number':
      return (
        <input
          type="number"
          {...register(field.fieldName, validation)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          defaultValue={field.defaultValue}
        />
      );
    case 'boolean':
      return (
        <input
          type="checkbox"
          {...register(field.fieldName)}
          className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
          defaultChecked={field.defaultValue}
        />
      );
    case 'date':
      return (
        <input
          type="date"
          {...register(field.fieldName, validation)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      );
    default:
      return (
        <input
          type="text"
          {...register(field.fieldName, validation)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      );
  }
};

export default DynamicResourceForm;