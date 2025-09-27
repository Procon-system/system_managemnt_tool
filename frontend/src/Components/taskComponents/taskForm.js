
import React, { useState, useCallback, useEffect } from 'react'; 
import DynamicFormField from './dynamicFormField';
import { SelectInput } from './selectInput';
import RichTextEditor from './richTextEditor';
import { useResources } from '../../hooks/useResources';
import { useUsers } from '../../hooks/useUsers';
import { useDebounce } from '../../hooks/useDebounce'; // Import the new hook
import { useSelector } from 'react-redux';
import RecurrencePicker from './recurrencePicker';
import { AiOutlineExclamationCircle } from 'react-icons/ai';

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
const parseLocalDateTime = (s) => {
    if (!s) return null;
    const [y, m, dTime] = s.split("-");
    const [d, hm] = [dTime.slice(0,2), dTime.slice(3)];
    const [hh, mm] = hm.split(":").map(Number);
    const dt = new Date();
    dt.setFullYear(Number(y));
    dt.setMonth(Number(m) - 1);
    dt.setDate(Number(d));
    dt.setHours(hh, mm, 0, 0);
    return isNaN(dt.valueOf()) ? null : dt;
  };
  
const TaskForm = ({ onSubmit, initialData = {}, resourceTypes }) => {
    const currentUser = useSelector((state) => state.auth.user);
    const isRegularUser = currentUser?.access_level === 2;
    const [endManuallyEdited, setEndManuallyEdited] = useState(false);
    const [formData, setFormData] = useState(() => getInitialFormData(initialData, currentUser));

    useEffect(() => {
        setFormData(getInitialFormData(initialData, currentUser));
    }, [JSON.stringify(initialData), currentUser]);

    const debouncedStartTime = useDebounce(formData.start_time, 500); // 500ms delay
    const debouncedEndTime = useDebounce(formData.end_time, 500);
    const typeIds = resourceTypes.map(t => t._id);

    const { 
        availableResources,
        isFetchingAvailable,
        getAvailableResourcesForType,
        checkRecurringAvailability,
        allResourcesByType,
        isCheckingRecurring,
        recurringConflict,
        clearRecurringConflict
    } = useResources(typeIds, { fetchAllOnMount: true })
  
    const { users, loading: usersLoading } = useUsers();
    
    const stableResourceTypes = JSON.stringify(resourceTypes);

   
    useEffect(() => {
        const types = JSON.parse(stableResourceTypes);
        clearRecurringConflict();
        types.forEach(type => {
          if (formData.repeat_frequency === 'none') {
            // simple one-off
            getAvailableResourcesForType(
              type._id,
              debouncedStartTime,
              debouncedEndTime
            );
          } else {
          
            const allIds = allResourcesByType[type._id]?.map(r => r._id) || [];
     
            if (allIds.length === 0 || !formData.task_period) return;
      
            checkRecurringAvailability({
              typeId:        type._id,             // so the slice knows who to update
              resourceIds:   allIds,               // ask about every resource of that type
              frequency:     formData.repeat_frequency,
              task_period:   formData.task_period,
              schedule: {
                start:  formData.start_time,
                end:    formData.end_time,
                // timezone: 'Africa/Addis_Ababa'  // include if your API needs it
              },
              organizationId: currentUser.organizationId
            });
          }
        });
      }, [debouncedStartTime, debouncedEndTime, formData.repeat_frequency, formData.task_period, stableResourceTypes, allResourcesByType, getAvailableResourcesForType, checkRecurringAvailability]);
        

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
                        
                        const isLoading = isFetchingAvailable || (formData.repeat_frequency !== 'none' && isCheckingRecurring);
                        return (
                            <div key={type._id} className="border rounded-lg p-4 bg-white">
                              {isLoading ? (
                                <div className="animate-pulse text-sm text-gray-500">
                                  {formData.repeat_frequency === 'none'
                                    ? 'Checking availability…'
                                    : 'Checking recurring availability…'}
                                </div>
                              ) : (
                                <div className="relative group">
                                  <DynamicFormField
                                    field={{
                                      fieldName: `resources.${type._id}`,
                                      displayName: type.name,
                                      fieldType: 'select',
                                      multiple: true,
                                      options: (availableResources[type._id] || []).map(res => ({
                                        label: res.displayName || res.name,
                                        value: res._id
                                      }))
                                    }}
                                    value={formData.resources?.[type._id] || []}
                                    onChange={e => handleResourceSelect(type._id, e)}
                                  />
                          
                                  {recurringConflict?.[type._id] && (
                                    <div className="absolute top-0 right-2 flex items-center">
                                      <AiOutlineExclamationCircle 
                                        className="w-5 h-5 text-red-500 cursor-pointer" 
                                      />
                                      {/* the tooltip itself */}
                                      <div className="
                                        absolute 
                                        bottom-full 
                                        right-0 
                                        mb-2 
                                        w-44 
                                        p-2 
                                        text-xs 
                                        text-white 
                                        bg-red-500 
                                        rounded 
                                        opacity-0 
                                        pointer-events-none 
                                        transition-opacity 
                                        group-hover:opacity-100
                                      ">
                                        {recurringConflict[type._id]}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                          
                              {type.description && (
                                <p className="text-xs text-gray-500 mt-2">
                                  {type.description}
                                </p>
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
   
    // const handleChange = useCallback((e) => {
    //     const { name, value } = e.target;
    //     if (name === "assigned_to" && isRegularUser) {
    //         return;
    //     }
        
    //     setFormData(prev => ({ ...prev, [name]: value }));
    // }, [isRegularUser]); 

    const handleNotesChange = (value) => {
        setFormData({ ...formData, notes: value });
    };
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
      
        // keep your rule
        if (name === "assigned_to" && isRegularUser) return;
      
        setFormData((prev) => {
          const next = { ...prev, [name]: value };
      
          if (name === "end_time") {
            // user touched end_time → stop auto-syncing afterwards
            setEndManuallyEdited(true);
      
            // guard: don't allow end before start (snap to start+1h)
            const start = parseLocalDateTime(next.start_time);
            const end = parseLocalDateTime(value);
            if (start && end && end < start) {
              next.end_time = formatDateTimeLocal(new Date(start.getTime() + 60 * 60 * 1000));
            }
            return next;
          }
      
          if (name === "start_time" && !endManuallyEdited) {
            // auto set end = start + 1h (only while user hasn't edited end_time)
            const start = parseLocalDateTime(value);
            if (start) {
              next.end_time = formatDateTimeLocal(new Date(start.getTime() + 60 * 60 * 1000));
            } else {
              // if start was cleared/invalid, clear end too
              next.end_time = "";
            }
          }
      
          return next;
        });
      }, [isRegularUser, endManuallyEdited]);
      
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