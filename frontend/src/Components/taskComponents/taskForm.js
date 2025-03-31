
// import { fetchTools } from '../../features/toolsSlice'; // Redux action to fetch tools
// import { fetchMaterials } from '../../features/materialsSlice'; // Redux action to fetch materials
// import { fetchFacilities } from '../../features/facilitySlice'; // Redux action to fetch facilities
// import { fetchMachines } from '../../features/machineSlice'; // Redux action to fetch machines
// import { getUsers } from '../../features/userSlice';
// const DateTimeWithAdjust = ({ label, name, value, onChange }) => {
//   const adjustTime = (hours) => {
//     let dateValue;

//     try {
//       // Parse the value into a Date object
//       dateValue = value ? new Date(value) : new Date();
//     } catch {
//       // Fallback to current date if parsing fails
//       dateValue = new Date();
//     }

//     // Adjust the time by the specified number of hours
//     const newDate = new Date(dateValue);
//     newDate.setHours(newDate.getHours() + hours);

//     // Format the adjusted date to match the input type `datetime-local`
//     const formattedDate = formatDateForInput(newDate);

//     // Trigger the onChange event with the updated value
//     onChange({ target: { name, value: formattedDate } });
//   };

//   // Helper function to format date for `datetime-local` input
//   const formatDateForInput = (date) => {
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const day = String(date.getDate()).padStart(2, "0");
//     const hours = String(date.getHours()).padStart(2, "0");
//     const minutes = String(date.getMinutes()).padStart(2, "0");
//     return `${year}-${month}-${day}T${hours}:${minutes}`;
//   };

//   return (
//     <div className="flex items-center">
//       <FormInput
//         label={label}
//         name={name}
//         type="datetime-local"
//         value={value}
//         onChange={onChange}
//         required
//       />
//       <div className="flex flex-col items-center space-y-1">
//         <button
//           type="button"
//           onClick={() => adjustTime(1)} // Increase time by 1 hour
//           className="w-6 h-6 text-white bg-blue-400 hover:bg-blue-500 rounded-full flex items-center justify-center"
//         >
//           ↑
//         </button>
//         <button
//           type="button"
//           onClick={() => adjustTime(-1)} // Decrease time by 1 hour
//           className="w-6 h-6 text-white bg-blue-400 hover:bg-blue-500 rounded-full flex items-center justify-center"
//         >
//           ↓
//         </button>
//       </div>
//     </div>
//   );
// };


// const TaskForm = ({ onSubmit,initialData = {} }) => {
//     const dispatch = useDispatch();
//     const tools = useSelector((state) => state.tools.tools) || []; 
//     const materials = useSelector((state) => state.materials.materials) || []; 
//     const facilities = useSelector((state) => state.facilities.facilities) || []; 
//     const machines = useSelector((state) => state.machines.machines) || []; 
//     const users =useSelector((state) => state.users.users) || [];
//     const formatDateForInput = (date) => {
//         return date ? date.toISOString().slice(0, 16) : ''; // Add null check
//       };
//       const [formData, setFormData] = useState({
//         title:'',
//         facility: '',
//         machine: '',
//         service_location: '',
//         task_period: '',
//         repeat_frequency: '',
//         status: 'pending',
//         notes: '',
//         start_time: formatDateForInput(new Date()),
//         end_time: '',
//         alarm_enabled: false,
//         assigned_to: [],
//         created_by: '',
//         tools: [],
//         materials: [],
//         // image: null,
//       });
//       useEffect(() => {
//         dispatch(fetchTools()); // Dispatch action to fetch tools
//         dispatch(fetchMaterials()); // Dispatch action to fetch materials
//         dispatch(fetchFacilities()); // Dispatch action to fetch facilities
//         dispatch(fetchMachines()); // Dispatch action to fetch machines
//         dispatch(getUsers());// Dispatch action to fetch users
//         setFormData((prevData) => ({
//             ...prevData,
//             ...initialData,
//             title: initialData.title || prevData.title,
//             start_time: initialData.start_time ? formatDateForInput(new Date(initialData.start_time)) : prevData.start_time,
//             end_time: initialData.end_time ? formatDateForInput(new Date(initialData.end_time)) : prevData.end_time,
//         }));
//     }, [dispatch,initialData]);

//       const handleChange = (e) => {
//         const { name, value, type, checked } = e.target;
//         setFormData({ 
//           ...formData, 
//           [name]: type === 'checkbox' ? checked : value 
//         });
//       };
    
//       const handleNotesChange = (value) => {
//         setFormData({ ...formData, notes: value });
//       };
      

//     const handleSubmit = async (e) => {
//       e.preventDefault(); // Prevent default form submission
//       e.stopPropagation(); // Stop event propagation
      
//       try {
//         const taskData = {
//           ...formData,
//           tools: formData.tools || [],
//           materials: formData.materials || [],
//         };
      
//         if (formData.image) {
//           const formDataPayload = new FormData();
//           formDataPayload.append("image", formData.image, formData.image.name);
          
//           // Check FormData contents
//           for (let [key, value] of formDataPayload.entries()) {
//             console.log(`${key}:`, value);
//           }
          
//           await onSubmit(formDataPayload);
//         } else {
//           await onSubmit(taskData);
//         }
        
//         // Reset form only after successful submission
//         setFormData({
//           title: '',
//           facility: '',
//           machine: '',
//           service_location: '',
//           task_period: '',
//           repeat_frequency: '',
//           status: 'pending',
//           notes: '',
//           start_time: formatDateForInput(new Date()),
//           end_time: '',
//           alarm_enabled: false,
//           assigned_to: [],
//           created_by: '',
//           tools: [],
//           materials: [],
//         });
        
//       } catch (error) {
//         console.error('Error submitting form:', error);
//       }
//     };
    
//       return (
// <form onSubmit={handleSubmit} className="space-y-4 p-4 mt-7 md:px-6 bg-blue-50 shadow-md rounded-md max-w-full lg:max-w-6xl  lg:mr-4">
// <h1 className="text-xl  font-bold text-center flex justify-center mb-6">Create Task</h1>
 
//   <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
//     <FormInput label="Title" name="title" value={formData.title} onChange={handleChange} required />
//     <SelectInput
//         label="To"
//         name="assigned_to"
//         value={formData.assigned_to}
//         onChange={handleChange}
//         options={Array.isArray(users) ? users.map(user => ({
//           label: `${user.first_name} ${user.last_name} (${user.email})`,
//           value: user._id,
//         })) : []}
//         isMulti
//         required
//       />
//         <FormInput label="Service Location" name="service_location" value={formData.service_location} onChange={handleChange} />
//   </div>

//   <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
//     <SelectInput
//       label="Facility"
//       name="facility"
//       value={formData.facility}
//       onChange={handleChange}
//       options={Array.isArray(facilities) ? facilities.map((facility) => ({
//         label: facility.facility_name,
//         value: facility._id,
//       })) : []}
//       required
//     />
//     <SelectInput
//       label="Machine"
//       name="machine"
//       value={formData.machine}
//       onChange={handleChange}
//       options={Array.isArray(machines) ? machines.map((machine) => ({
//         label: machine.machine_name,
//         value: machine._id,
//       })) : []}
//       required
//     />
//     <SelectInput
//       label="Tools"
//       name="tools"
//       value={formData.tools}
//       onChange={handleChange}
//       options={Array.isArray(tools) ? tools.map(tool => ({
//         label: tool.tool_name,
//         value: tool._id,
//       })) : []}
//       isMulti
//       required
//     />
//   </div>

//   <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
//          <SelectTaskPeriodInput
//     label="Task Period"
//     name="task_period"
//     value={formData.task_period}
//     onChange={handleChange}
//     required
//   />

//   <SelectInput
//     label="Frequency"
//     name="repeat_frequency"
//     value={formData.repeat_frequency}
//     onChange={handleChange}   
//     options={[
//       { label: 'None', value: 'none' },
//       { label: 'Daily', value: 'daily' },
//       { label: 'Weekly', value: 'weekly' },
//       { label: 'Monthly', value: 'monthly' },
//       { label: 'Yearly', value: 'yearly' },
//     ]}
//     required
//   />
//        <SelectInput
//       label="Materials"
//       name="materials"
//       value={formData.materials}
//       onChange={handleChange}
//       options={Array.isArray(materials) && materials.filter(material => material.amount_available > 0).length > 0 
//         ? materials
//             .filter(material => material.amount_available > 0)
//             .map(material => ({
//               label: material.material_name,
//               value: material._id,
//             }))
//         : [{ label: 'No available materials', value: '', isDisabled: true }]}
//       isMulti
//       required
//     />
//   </div>
//   <div className="flex flex-wrap items-center gap-4">
//   <div className="flex-1 min-w-[200px]">
//     <SelectInput
//       label="Status"
//       name="status"
//       value={formData.status}
//       onChange={handleChange}
//       options={[
//         { label: 'Pending', value: 'pending' },
//         { label: 'In Progress', value: 'in progress' },
//         { label: 'Done', value: 'done' },
//         { label: 'Overdue', value: 'overdue' },
//       ]}
//     />
//   </div>

//   <div className="flex-1 min-w-[180px]">
//     <DateTimeWithAdjust
//       label="Start Time"
//       name="start_time"
//       value={formData.start_time}
//       onChange={handleChange}
//     />
//   </div>

//   <div className="flex-1 min-w-[180px]">
//     <DateTimeWithAdjust
//       label="End Time"
//       name="end_time"
//       value={formData.end_time}
//       onChange={handleChange}
//     />
//   </div>
// </div>

//   <div>
//     <label className="block mb-1 text-sm font-medium text-gray-600">Notes</label>
//     <RichTextEditor value={formData.notes} onChange={handleNotesChange} />
//   </div>
 
//   <button type="submit" className="w-full px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700" onClick={(e) => {
//     e.preventDefault();
//     handleSubmit(e);
//   }}>
//     Create Task
//   </button>
// </form>

//     );
// };

// export default TaskForm;
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import DynamicFormField from './dynamicFormField';

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
      <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
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

      {/* Resource Selection */}
      {categorizedResources && Object.entries(categorizedResources).map(([category, resources]) => (
        <div key={category} className="space-y-2">
          <h3 className="text-lg font-medium capitalize">{category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map(resourceType => (
              <div key={resourceType._id} className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">{resourceType.name}</h4>
                <DynamicFormField
                  field={{
                    fieldName: `resources.${resourceType._id}`,
                    displayName: `Select ${resourceType.name}`,
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