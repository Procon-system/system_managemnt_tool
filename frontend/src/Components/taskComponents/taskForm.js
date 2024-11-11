import React, { useState,useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FormInput from './formInput';
import SelectInput from './selectInput';
import RichTextEditor from './richTextEditor';
import { fetchTools } from '../../features/toolsSlice'; // Redux action to fetch tools
import { fetchMaterials } from '../../features/materialsSlice'; // Redux action to fetch materials
import { fetchFacilities } from '../../features/facilitySlice'; // Redux action to fetch facilities
import { fetchMachines } from '../../features/machineSlice'; // Redux action to fetch machines

function getColorForStatus(status) {
    switch (status) {
        case 'done':
            return 'green';
        case 'in progress':
            return 'green';
        case 'pending':
            return 'yellow';
        case 'overdue':
            return 'red';
        default:
            return 'green'; // default color if status is undefined or unexpected
    }
}
const TaskForm = ({ onSubmit,initialData = {} }) => {
    const dispatch = useDispatch();
    const tools = useSelector((state) => state.tools.tools); 
    const materials = useSelector((state) => state.materials.materials); 
    const facilities = useSelector((state) => state.facilities.facilities); 
    const machines = useSelector((state) => state.machines.machines); 

    const formatDateForInput = (date) => {
        return date.toISOString().slice(0, 16); // Format as 'YYYY-MM-DDTHH:MM'
      };
    //   const formatDateForInput = (date) => {
    //     const year = date.getFullYear();
    //     const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    //     const day = String(date.getDate()).padStart(2, '0');
    //     const hours = String(date.getHours()).padStart(2, '0');
    //     const minutes = String(date.getMinutes()).padStart(2, '0');
    
    //     // Format as 'YYYY-MM-DDTHH:MM'
    //     return `${year}-${month}-${day}T${hours}:${minutes}`;
    // };
    // const userId = useSelector((state) => state.auth.user._id);
    //    console.log("id",userId)
      const [formData, setFormData] = useState({
        title:'',
        facility: '',
        machine: '',
        service_location: '',
        task_period: '',
        repeat_frequency: '',
        status: 'pending',
        notes: '',
        start_time: formatDateForInput(new Date()),
        end_time: '',
        alarm_enabled: false,
        assigned_to_email: '',
        created_by: '',
        tools: [],
        materials: [],
      });
      useEffect(() => {
        dispatch(fetchTools()); // Dispatch action to fetch tools
        dispatch(fetchMaterials()); // Dispatch action to fetch materials
        dispatch(fetchFacilities()); // Dispatch action to fetch facilities
        dispatch(fetchMachines()); // Dispatch action to fetch machines

        setFormData((prevData) => ({
            ...prevData,
            ...initialData,
            title: initialData.title ? initialData.title : prevData.title,
            start_time: initialData.start_time ? formatDateForInput(new Date(initialData.start_time)) : prevData.start_time,
            end_time: initialData.end_time ? formatDateForInput(new Date(initialData.end_time)) : prevData.end_time,
        }));
    }, [dispatch,initialData]);

      const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ 
          ...formData, 
          [name]: type === 'checkbox' ? checked : value 
        });
      };
    
      const handleNotesChange = (value) => {
        setFormData({ ...formData, notes: value });
      };
    
      const handleSubmit = (e) => {
        e.preventDefault();
                console.log("Submitting Task Data:", formData.status);
        const color_code = getColorForStatus(formData.status);  // Get color based on status
        const taskData = {
            ...formData,
            tools: formData.tools || [], // Ensure tools is always an array
            materials: formData.materials || [],
            color_code,
          };
          console.log("data",taskData)
          onSubmit(taskData); 
      };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-6 md:px-10 bg-blue-50 shadow-md rounded-md max-w-lg md:max-w-7xl lg:max-w-7xl mx-auto">
            <div className=''>
            
            </div>
            
    <div className="flex flex-col md:flex-row md:space-x-4">
    <FormInput label="Title" name="title" value={formData.title} onChange={handleChange} required />

        <FormInput label="Assigned Person Email" name="assigned_to_email" value={formData.assigned_to_email} onChange={handleChange} required />
        <FormInput label="Service Location" name="service_location" value={formData.service_location} onChange={handleChange} />


    </div>

    <div className="flex flex-col md:flex-row md:space-x-4">
    <SelectInput
    label="Facility"
    name="facility"
    value={formData.facility} // Controlled value
    onChange={handleChange}
    options={facilities.map((facility) => ({
        label: facility.facility_name,
        value: facility._id,
    }))}
    required
/>

<SelectInput
    label="Machine"
    name="machine"
    value={formData.machine}
    onChange={handleChange}
    options={machines.map((machine) => ({
        label: machine.machine_name,  // Display name
        value: machine._id,  // Use machine_name as value to send the name
    }))}
    required
/>

<SelectInput
    label="Tools"
    name="tools"
    value={formData.tools}
    onChange={handleChange}
    options={tools.map((tool) => ({
        label: tool.tool_name,        // Display name
        value: tool._id,        // Use tool_name as value to send the name
    }))}
    multiple
    required
/>

                </div>

   

    <div className="flex flex-col md:flex-row md:space-x-4">
        <FormInput label="Task Period" name="task_period" value={formData.task_period} onChange={handleChange} />
        <FormInput label="Repeat Frequency" name="repeat_frequency" value={formData.repeat_frequency} onChange={handleChange} />
    </div>

    <div className="flex flex-col md:flex-row md:space-x-4">
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
        {/* <FormInput label="Facility" name="facility" value={formData.facility} onChange={handleChange} required /> */}
        <SelectInput
    label="Materials"
    name="materials"
    value={formData.materials}
    onChange={handleChange}
    options={materials.map((material) => ({
        label: material.material_name, // Display name
        value: material._id, // Use material_name as value to send the name
    }))}
    multiple
    required
/>
    </div>

    <div className="flex flex-col md:flex-row md:space-x-4">
        <FormInput label="Start Time" name="start_time" type="datetime-local" value={formData.start_time} onChange={handleChange} required />
        <FormInput label="End Time" name="end_time" type="datetime-local" value={formData.end_time} onChange={handleChange} required />
    </div>

    <div>
        <label className="block mb-1 text-sm font-medium text-gray-600">Notes</label>
        <RichTextEditor value={formData.notes} onChange={handleNotesChange} />
    </div>

    <button type="submit" className="w-full px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
        Create Task
    </button>
</form>

    );
};

export default TaskForm;
