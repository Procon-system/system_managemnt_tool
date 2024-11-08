
import React, { useState } from 'react';
import FormInput from './formInput';
import SelectInput from './selectInput';
import RichTextEditor from './richTextEditor';
// import getColorForStatus from './taskColor';
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
const TaskForm = ({ onSubmit }) => {
    const formatDateForInput = (date) => {
        return date.toISOString().slice(0, 16); // Format as 'YYYY-MM-DDTHH:MM'
      };
    
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
        end_time: formatDateForInput(new Date()),
        // color_code: 'green',
        alarm_enabled: false,
        assigned_to: '',
        created_by: '',
        tools: '',
        materials: '',
      });
    
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
        onSubmit({ ...formData, color_code });  // Add color code to the submission

      };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-6 md:px-10 bg-blue-50 shadow-md rounded-md max-w-lg md:max-w-7xl lg:max-w-7xl mx-auto">
            <div className=''>
            <FormInput label="Title" name="title" value={formData.title} onChange={handleChange} required />

            </div>
            
    <div className="flex flex-col md:flex-row md:space-x-4">
        <FormInput label="Assigned Person" name="assigned_to" value={formData.assigned_to} onChange={handleChange} required />
        <FormInput label="Assigned By" name="created_by" value={formData.created_by} onChange={handleChange} required />
               <FormInput label="Service Location" name="service_location" value={formData.service_location} onChange={handleChange} />


    </div>

    <div className="flex flex-col md:flex-row md:space-x-4">
                <FormInput label="Materials" name="materials" value={formData.materials} onChange={handleChange} required />
                <FormInput label="Machine" name="machine" value={formData.machine} onChange={handleChange} required />
                <FormInput label="Tools" name="tools" value={formData.tools} onChange={handleChange} required />
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
        {/* <SelectInput
            label="Color Code"
            name="color_code"
            value={formData.color_code}
            onChange={handleChange}
            options={[
                { label: 'Green', value: 'green' },
                { label: 'Yellow', value: 'yellow' },
                { label: 'Red', value: 'red' },
            ]}
        /> */}
        <FormInput label="Facility" name="facility" value={formData.facility} onChange={handleChange} required />
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
