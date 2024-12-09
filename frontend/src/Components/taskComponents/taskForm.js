import React, { useState,useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FormInput from './formInput';
import SelectInput from './selectInput';
import RichTextEditor from './richTextEditor';
import { fetchTools } from '../../features/toolsSlice'; // Redux action to fetch tools
import { fetchMaterials } from '../../features/materialsSlice'; // Redux action to fetch materials
import { fetchFacilities } from '../../features/facilitySlice'; // Redux action to fetch facilities
import { fetchMachines } from '../../features/machineSlice'; // Redux action to fetch machines
import { getUsers } from '../../features/userSlice';
const TaskForm = ({ onSubmit,initialData = {} }) => {
    const dispatch = useDispatch();
    const tools = useSelector((state) => state.tools.tools); 
    const materials = useSelector((state) => state.materials.materials); 
    const facilities = useSelector((state) => state.facilities.facilities); 
    const machines = useSelector((state) => state.machines.machines); 
    const users =useSelector((state) => state.users.users);
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
        end_time: '',
        alarm_enabled: false,
        assigned_to: [],
        created_by: '',
        tools: [],
        materials: [],
        // image: null,
      });
      useEffect(() => {
        dispatch(fetchTools()); // Dispatch action to fetch tools
        dispatch(fetchMaterials()); // Dispatch action to fetch materials
        dispatch(fetchFacilities()); // Dispatch action to fetch facilities
        dispatch(fetchMachines()); // Dispatch action to fetch machines
        dispatch(getUsers());// Dispatch action to fetch users
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
      // const handleFileChange = (e) => {
      //   const file = e.target.files[0];
      //   if (file && file.type.startsWith("image/") && file.size <= 2 * 1024 * 1024) { // 2MB limit
      //     setFormData({
      //       ...formData,
      //       image: file,
      //     });
      //   } else {
      //     alert("Please select a valid image file (max 2MB).");
      //   }
      // };
    //   const handleFileChange = (e) => {
    //     const file = e.target.files[0];
    //     if (file && file.type.startsWith("image/") && file.size <= 2 * 1024 * 1024) {
    //         console.log("Selected file:", file); // Add this to debug
    //         setFormData({
    //             ...formData,
    //             image: file,
    //         });
    //     } else {
    //         alert("Please select a valid image file (max 2MB).");
    //     }
    // };
    const handleSubmit = (e) => {
      e.preventDefault();
    
      const taskData = {
        ...formData,
        tools: formData.tools || [],
        materials: formData.materials || [],
      };
    
      if (formData.image) {
        const formDataPayload = new FormData();
        console.log("image before appending:", formData.image);
    
        // Only append image for debugging
        formDataPayload.append("image", formData.image, formData.image.name);
    
        // Check FormData contents
        console.log("Submitting with image:",formDataPayload);
        for (let [key, value] of formDataPayload.entries()) {
          console.log(`${key}:`, value);
        }
        
        // Submit FormData
        onSubmit(formDataPayload);
      } else {
        console.log("Submitting without image:", taskData);
        onSubmit(taskData);
      }
    };
    
      return (
<form onSubmit={handleSubmit} className="space-y-4 p-4 mt-7 md:px-6 bg-blue-50 shadow-md rounded-md max-w-full lg:max-w-6xl  lg:mr-4">
<h1 className="text-xl  font-bold text-center flex justify-center mb-6">Create Task</h1>
 
  <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
    <FormInput label="Title" name="title" value={formData.title} onChange={handleChange} required />
    <SelectInput
        label="To"
        name="assigned_to"
        value={formData.assigned_to}
        onChange={handleChange}
        options={users.map(user => ({
          label: `${user.first_name} ${user.last_name} (${user.email})`,
          value: user._id,
        }))}
        isMulti
        required
      />
    {/* <FormInput label="Assigned Person Email" name="assigned_to_email" value={formData.assigned_to_email} onChange={handleChange} required /> */}
    <FormInput label="Service Location" name="service_location" value={formData.service_location} onChange={handleChange} />
  </div>

  <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
    <SelectInput
      label="Facility"
      name="facility"
      value={formData.facility}
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
        label: machine.machine_name,
        value: machine._id,
      }))}
      required
    />
    <SelectInput
      label="Tools"
      name="tools"
      value={formData.tools}
      onChange={handleChange}
      options={tools.map(tool => ({
        label: tool.tool_name,
        value: tool._id,
      }))}
      isMulti
      required
    />
  </div>

  <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
    <FormInput label="Task Period" name="task_period" value={formData.task_period} onChange={handleChange} />
    <FormInput label="Repeat Frequency" name="repeat_frequency" value={formData.repeat_frequency} onChange={handleChange} />
       <SelectInput
      label="Materials"
      name="materials"
      value={formData.materials}
      onChange={handleChange}
      options={materials.map(material => ({
        label: material.material_name,
        value: material._id,
      }))}
      isMulti
      required
    />
  </div>

  <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
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
     <FormInput label="Start Time" name="start_time" type="datetime-local" value={formData.start_time} onChange={handleChange} required />
     <FormInput label="End Time" name="end_time" type="datetime-local" value={formData.end_time} onChange={handleChange} required />

  </div>

  <div>
    <label className="block mb-1 text-sm font-medium text-gray-600">Notes</label>
    <RichTextEditor value={formData.notes} onChange={handleNotesChange} />
  </div>
  {/* <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Image</label>
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleFileChange} // Handle file input
          className="mt-1"
        />
      </div> */}
  <button type="submit" className="w-full px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
    Create Task
  </button>
</form>

    );
};

export default TaskForm;
