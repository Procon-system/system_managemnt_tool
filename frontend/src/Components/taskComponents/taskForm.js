
import React, { useState, useCallback, useEffect } from 'react'; 
import DynamicFormField from './dynamicFormField';
import { SelectInput } from './selectInput';
import RichTextEditor from './richTextEditor';
import { useResources } from '../../hooks/useResources';
import { useUsers } from '../../hooks/useUsers';
import { useDebounce } from '../../hooks/useDebounce'; // Import the new hook
import { useSelector } from 'react-redux';
import RecurrencePicker from './recurrencePicker';
const formatDateTimeLocal = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.valueOf())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatDateTimeFromUTCString = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString); 
    if (isNaN(date.valueOf())) return ''; 

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getInitialFormData = (initialData,currentUser) => {
    const isRegularUser = currentUser?.access_level === 2;
       if (initialData?.start_time) {
        const startTimeString = initialData.start_time;
        const endTimeString = initialData.end_time ||
            // Calculate end time also in UTC
            new Date(new Date(startTimeString).setUTCHours(new Date(startTimeString).getUTCHours() + 1)).toISOString();

        return {
            title: initialData.title || "new task",
            start_time: formatDateTimeFromUTCString(startTimeString),
            end_time: formatDateTimeFromUTCString(endTimeString),
            status: initialData.status || 'pending',
            assignedResources: initialData.assignedResources || [],
            assigned_to: isRegularUser ? [currentUser._id] : [],
            resources: initialData.resources || {},
            notes: initialData.notes || '',
            repeat_frequency: initialData.repeat_frequency || 'none',
            task_period: initialData.task_period || null,
        };
    }

    const defaultStartTime = new Date();
    const defaultEndTime = new Date(new Date(defaultStartTime).setHours(defaultStartTime.getHours() + 1));

    return {
        title: "",
        start_time: formatDateTimeLocal(defaultStartTime), // Use the local formatter here
        end_time: formatDateTimeLocal(defaultEndTime),   // Use the local formatter here
        status: 'pending',
        assignedResources: [],
        assigned_to: isRegularUser ? [currentUser._id] : [],
        resources: {},
        notes: '',
        repeat_frequency: 'none',
        task_period: null,
    };
};
const TaskForm = ({ onSubmit, initialData = {}, resourceTypes }) => {
    const currentUser = useSelector((state) => state.auth.user);
    const isRegularUser = currentUser?.access_level === 2;

    const [formData, setFormData] = useState(() => getInitialFormData(initialData, currentUser));

    useEffect(() => {
        setFormData(getInitialFormData(initialData, currentUser));
    }, [JSON.stringify(initialData), currentUser]);

    const debouncedStartTime = useDebounce(formData.start_time, 500); // 500ms delay
    const debouncedEndTime = useDebounce(formData.end_time, 500);
    
    const { 
        availableResources,
        isFetchingAvailable,
        getAvailableResourcesForType,
    } = useResources();
  
    const { users, loading: usersLoading } = useUsers();
    
    const stableResourceTypes = JSON.stringify(resourceTypes);

    useEffect(() => {
        // We need to parse the stringified types back into an array to use it.
        const currentResourceTypes = JSON.parse(stableResourceTypes);

        if (debouncedStartTime && debouncedEndTime && currentResourceTypes?.length > 0) {
            currentResourceTypes.forEach(type => {
                getAvailableResourcesForType(type._id, debouncedStartTime, debouncedEndTime);
            });
        }    }, [debouncedStartTime, debouncedEndTime, stableResourceTypes, getAvailableResourcesForType]);

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

    
    const handleRecurrenceChange = useCallback((recurrenceValues) => {
        setFormData(prevData => ({
            ...prevData,
            ...recurrenceValues
        }));
    }, []); 

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
                        const resources = availableResources[type._id] || [];
                        
                        // 2. Use the new loading state.
                        const isLoading = isFetchingAvailable;
    
                        return (
                            <div key={type._id} className="border rounded-lg p-4 bg-white">
                                {isLoading ? (
                                    <div className="text-sm text-gray-500 animate-pulse">
                                        Checking availability...
                                    </div>
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
                                        
                                        onChange={(e) => handleResourceSelect(type._id, e)}
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
    
    // const handleChange = (e) => {
    //     const { name, value } = e.target;
    //     setFormData(prev => ({ ...prev, [name]: value }));
    // };
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        if (name === "assigned_to" && isRegularUser) {
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    }, [isRegularUser]); 

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
                    {/* <div>
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
                    </div> */}
                    <div>
                    {isRegularUser ? (
                        // If user has access_level 2, show a disabled field with their name.
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Assign To</label>
                            <input
                                type="text"
                                value={`${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.email}
                                disabled
                                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed"
                                title="As a user, you can only assign tasks to yourself."
                            />
                        </div>
                    ) : (
                        // For all other users, show the full multi-select dropdown.
                        <DynamicFormField
                            field={{
                                fieldName: "assigned_to",
                                displayName: "Assign To",
                                fieldType: "select",
                                multiple: true,
                                options: users.map(user => ({
                                    label: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
                                    value: user._id
                                }))
                            }}
                            value={formData.assigned_to || []}
                            onChange={handleChange}
                            isLoading={usersLoading}
                        />
                    )}
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