
import React, { useState, useCallback } from 'react'; 
import DynamicFormField from './dynamicFormField';
import { SelectInput } from './selectInput';
import RichTextEditor from './richTextEditor';
import { useResources } from '../../hooks/useResources';
import { useUsers } from '../../hooks/useUsers';
import RecurrencePicker from './recurrencePicker';

const TaskForm = ({ onSubmit, initialData = {}, resourceTypes }) => {
    const [formData, setFormData] = useState(initialData);
    const typeIds = resourceTypes?.map(type => type._id) || [];
    const { getResourcesByType, loading: resourcesLoading } = useResources(typeIds);
    const { users, loading: usersLoading } = useUsers();

    const handleResourceSelect = (resourceTypeId, event) => {
        const selectedResources = event.target.value;

        setFormData(prev => ({
            ...prev,
            resources: {
                ...prev.resources,
                [resourceTypeId]: Array.isArray(selectedResources)
                    ? selectedResources
                    : [selectedResources].filter(Boolean)
            }
        }));
    };

    // 2. Wrap the function in useCallback with an empty dependency array
    // This is the critical fix.
    const handleRecurrenceChange = useCallback((recurrenceValues) => {
        setFormData(prevData => ({
            ...prevData,
            ...recurrenceValues
        }));
    }, []); // Empty array means this function is created only once.

    const renderResourceFields = () => {
        if (!resourceTypes?.length) return null;

        return Object.entries(
            resourceTypes.reduce((acc, type) => {
                const category = type.category || 'other';
                if (!acc[category]) acc[category] = [];
                acc[category].push(type);
                return acc;
            }, {})
        ).map(([category, types]) => (
            <div key={category} className="space-y-4">
                <h2 className="text-lg font-semibold capitalize">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {types.map(type => {
                        const resources = getResourcesByType(type._id);
                        const isLoading = !resources.length && resourcesLoading;

                        return (
                            <div key={type._id} className="border rounded-lg p-4 bg-white">
                                {isLoading ? (
                                    <div>Loading {type.name} resources...</div>
                                ) : (
                                    <DynamicFormField
                                        field={{
                                            fieldName: `resources.${type._id}`,
                                            displayName: type.name,
                                            fieldType: 'select',
                                            multiple: true,
                                            options: resources.map(res => ({
                                                label: res.displayName || res.name,
                                                value: res._id
                                            }))
                                        }}
                                        value={formData.resources?.[type._id] || []}
                                        onChange={(selected) => handleResourceSelect(type._id, selected)}
                                    />
                                )}
                                {type.description && (
                                    <p className="text-xs text-gray-500 mt-2">{type.description}</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        ));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleNotesChange = (value) => {
        setFormData({ ...formData, notes: value });
    };

    return (
        // The rest of your JSX remains the same
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
                        <DynamicFormField
                            field={{
                                fieldName: "assigned_to",
                                displayName: "Assign To",
                                fieldType: "select",
                                multiple: true,
                                options: users.map(user => ({
                                    label: user.name || user.email,
                                    value: user._id
                                }))
                            }}
                            value={formData.assigned_to || []}
                            onChange={handleChange}
                            isLoading={usersLoading}
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

                    <div >
                        <RecurrencePicker
                            value={{
                                repeat_frequency: formData.repeat_frequency,
                                task_period: formData.task_period // Pass current values
                            }}
                            onChange={handleRecurrenceChange}
                            startDate={formData.start_time} // Pass the task's start date!
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

            <div className="space-y-4">
                {renderResourceFields()}
            </div>

            <div className="mt-6">
                <label className="block mb-1 text-sm font-medium text-gray-600">Notes</label>
                <RichTextEditor value={formData.notes} onChange={handleNotesChange} />
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