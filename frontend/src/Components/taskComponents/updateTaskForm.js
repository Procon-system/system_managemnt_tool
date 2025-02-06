

import { useState, useEffect } from 'react';
import { FaClock, FaStickyNote, FaCheckCircle, FaSyncAlt, FaCalendarAlt, FaCogs, FaBuilding, FaWrench, FaBoxOpen, FaUserAlt  } from 'react-icons/fa';
import { useDispatch,useSelector } from 'react-redux';
import RichTextEditor from './richTextEditor';
import {SelectInput,getSelectedOptions,SelectTaskPeriodInput} from './selectInput';
import { fetchTools } from '../../features/toolsSlice'; // Redux action to fetch tools
import { fetchMaterials } from '../../features/materialsSlice'; // Redux action to fetch materials
import { fetchFacilities } from '../../features/facilitySlice'; // Redux action to fetch facilities
import { fetchMachines } from '../../features/machineSlice'; // Redux action to fetch machines
import { getUsers } from '../../features/userSlice';
import DOMPurify from "dompurify";
const EventDetailsModal = ({
  isVisible,
  closeModal,
  selectedEvent,
  role,
  handleDelete,
  handleFormSubmit,
}) => {
  const dispatch = useDispatch();
  const [editableEvent, setEditableEvent] = useState(selectedEvent || {});

useEffect(() => {
  setEditableEvent(selectedEvent || {});
}, [selectedEvent]);

const handleChange = (e) => {
  setEditableEvent((prev) => ({
    ...prev,
    [e.target.name]: e.target.value,
  }));
};
const handleFileChange = (e) => {
  const file = e.target.files[0]; 
  setEditableEvent((prev) => ({
    ...prev,
    image: file,
  }));
};
const onSubmit = (e) => {
  e.preventDefault();
  handleFormSubmit(editableEvent);
};
  // Fetch Data from Redux Store
  const { users } = useSelector((state) => state.users);
  const { tools } = useSelector((state) => state.tools);
  const { materials } = useSelector((state) => state.materials);
  const { facilities } = useSelector((state) => state.facilities);
  const { machines } = useSelector((state) => state.machines);

  // Fetch Data on Component Mount
  useEffect(() => {
    if (isVisible) {
      dispatch(getUsers());
      dispatch(fetchTools());
      dispatch(fetchMaterials());
      dispatch(fetchFacilities());
      dispatch(fetchMachines());
    }
  }, [dispatch, isVisible]);
  // Convert ID arrays to Names
  const getUserNames = (usersArray) =>
    usersArray
      ?.map((user) => {
        // If user is an object, use its properties; otherwise, find it by ID
        if (typeof user === "object") {
          return `${user.first_name} ${user.last_name}`;
        }
        const foundUser = users.find((u) => u._id === user);
        return foundUser ? `${foundUser.first_name} ${foundUser.last_name}` : "Unknown User";
      })
      .join(", ") || "Not set";
  
  const getToolNames = (toolsArray) =>
    toolsArray
      ?.map((tool) => {
        if (typeof tool === "object") {
          return tool.tool_name;
        }
        const foundTool = tools.find((t) => t._id === tool);
        return foundTool ? foundTool.tool_name : "Unknown Tool";
      })
      .join(", ") || "Not set";
  
      const getMaterialNames = (materialsArray) =>
        materialsArray
          ?.map((material) => {
            // If material is an object, use its properties; otherwise, find it by ID
            if (typeof material === "object") {
              return material.material_name;
            }
            const foundMaterial = materials.find((m) => m._id === material);
            return foundMaterial ? foundMaterial.material_name : "Unknown Material";
          })
          .join(", ") || "Not set";
      
  const getFacilityName = (id) => {
        const facility = facilities.find((f) => f._id === id);
        return facility ? facility.facility_name : 'Unknown Facility';
      };
    
  const getMachineName = (id) => {
        const machine = machines.find((m) => m._id === id);
        return machine ? machine.machine_name : 'Unknown Machine';
      };
      const machineOptions = machines.map(machine => ({
        label: machine.machine_name,
        value: machine._id
      }));
      
      const facilityOptions = facilities.map(facility => ({
        label: facility.facility_name,
        value: facility._id
      }));
      
      
      const toolOptions = tools.map(tool => ({
        label: tool.tool_name,
        value: tool._id
      }));
      
      const materialOptions = materials.map(material => ({
        label: material.material_name,
        value: material._id
      }));
      const userOptions = users.map(user => ({
        label: `${user.first_name} ${user.last_name}`, // Use backticks
        value: user._id
      }));
      
  console.log("editableEvent",editableEvent)
  // const onSubmit = (e) => {
  //   e.preventDefault();
  //   const updatedEvent = {
  //     ...editableEvent,
  //     status: e.target.status?.value,
  //     notes: e.target.notes?.value,
  //     repeat_frequency: e.target.repeat_frequency?.value,
  //     task_period: e.target.task_period?.value,
  //     machine: e.target.machine?.value,
  //     facility: e.target.facility?.value,
  //     assigned_to: editableEvent.assigned_to || [],
  //     tools: editableEvent.tools || [],
  //     materials: editableEvent.materials || [],
  //   };

  //   if (role >= 3) {
  //     updatedEvent.title = e.target.title?.value;
  //     updatedEvent.start_time = e.target.start?.value;
  //     updatedEvent.end_time = e.target.end?.value;
  //   }

  //   const imageFile = e.target.image?.files[0]; // Access the uploaded image file
  //   if (imageFile) {
  //     updatedEvent.image = imageFile;
  //   }

  //   handleFormSubmit(updatedEvent); // Pass updated event data to the handler
  // };

  const [isEditMode, setIsEditMode] = useState(false);

  const toggleEditMode = () => {
    setIsEditMode((prev) => !prev);
  };

  if (!isVisible || !editableEvent) return null;
  if (!editableEvent) {
    return <p>Loading event details...</p>;  // Show a loading message instead of crashing
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="relative bg-white p-6 rounded-lg max-w-3xl w-full">
        <button
          type="button"
          onClick={closeModal}
          className="absolute top-2 right-2 text-red-700 hover:text-red-900 text-2xl font-bold transition-transform transform hover:scale-110"
          aria-label="Close"
        >
          &times;
        </button>

        <form onSubmit={onSubmit} className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold bg-blue-400 text-white px-5 py-1 rounded-md hover:bg-blue-400">
              Event Information
            </h3>
            <div className='space-x-2'>
            {role >= 3 && (
              <button
                type="button"
                className="bg-red-700 md:ml-[100px] text-white px-4 py-1 rounded-md hover:bg-red-600 transition"
                onClick={() => handleDelete(editableEvent?._id)}
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={toggleEditMode}
              className="bg-blue-400 text-white px-5 py-1 mr-2 rounded-md hover:bg-blue-600 transition"
            >
              {isEditMode ? 'Cancel' : 'Edit'}
            </button>
            </div>
          </div>

          {/* Conditional rendering based on edit mode */}
          {isEditMode ? (
            <>
              {role >= 3 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium">Title:</label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={editableEvent?.title}
                      // value={editableEvent.title}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">Start Time:</label>
                    <input
                      type="datetime-local"
                      name="start"
                      defaultValue={
                        new Date(editableEvent?.start).toLocaleDateString("en-CA") +
                        "T" +
                        new Date(editableEvent?.start).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })
                      }
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">End Time:</label>
                    <input
                      type="datetime-local"
                      name="end"
                      defaultValue={
                        new Date(editableEvent?.end).toLocaleDateString("en-CA") +
                        "T" +
                        new Date(editableEvent?.end).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })
                      }
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div>
                  <SelectInput
    label="Frequency"
    name="repeat_frequency"
    value={editableEvent?.repeat_frequency}
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
                  <SelectTaskPeriodInput
    label="Task Period"
    name="task_period"
    value={editableEvent?.task_period}
    onChange={handleChange}
    required
  />
                  </div>

                  <div>
    <SelectInput
    label="Machine"
    name="machine"
    value={editableEvent?.machine}
    onChange={handleChange}
    options={machineOptions}
  />
</div>

<div>
   <SelectInput
    label="Facility"
    name="facility"
    value={editableEvent?.facility}
    onChange={handleChange}
    options={facilityOptions}
  />
</div>

<div>
<SelectInput
    label="Assigned To"
    name="assigned_to"
    value={editableEvent?.assigned_to ? getSelectedOptions(editableEvent.assigned_to, userOptions) : []}
    onChange={handleChange}
    options={userOptions}
    isMulti={true}
  />
</div>

<div>
   <SelectInput
    label="Tools"
    name="tools"
    value={editableEvent?.tools ? getSelectedOptions(editableEvent.tools, toolOptions) : []}
    onChange={handleChange}
    options={toolOptions}
    isMulti={true}
  />
</div>

<div>
    <SelectInput
    label="Materials"
    name="materials"
    value={editableEvent?.materials ? getSelectedOptions(editableEvent.materials, materialOptions) : []}
    onChange={handleChange}
    options={materialOptions}
    isMulti={true}
  />
</div>


                </div>
              )}

              {role >= 2 && (
                <div>
<div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium">Status:</label>
                    <select
                      name="status"
                      
                      defaultValue={editableEvent?.status || 'pending'}
                      onChange={(e) => handleChange(e)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
        
                      <option value="pending">Pending</option>
                      <option value="in progress">In progress</option>
                      <option value="done">Done</option>
                      <option value="impossible">Impossible</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">Upload Image:</label>
                    <input
                      type="file"
                      name="image"
                      onChange={handleFileChange}
                      className="w-full px-3 py-1 border rounded-md"
                    />
                  </div>
                 

                 
                </div>
                <div>
                    <label className="block mb-1 text-sm font-medium">Note:</label>
                    <RichTextEditor 
  value={editableEvent?.notes} 
  onChange={(value) => handleChange({ target: { name: "notes", value } })} 
/>

                    {/* <RichTextEditor value={editableEvent.notes} /> */}
                  </div>
                </div>
                
              )}
            </>
          ): (
            <div className="grid grid-cols-2 gap-4">
  <div className="flex items-center justify-center col-span-2">
    <p className="text-center font-bold">{editableEvent?.title}</p>
  </div>

  <div className="col-span-2 flex justify-center">
    {editableEvent?.image ? (
      <img
        src={`http://localhost:5000/api/tasks/get-image/${editableEvent?._id}`}
        alt={editableEvent?.title || 'Event Image'}
        className="w-[500px] h-[250px] object-cover"
      />
    ) : (
      <p>No image available</p>
    )}
  </div>

  <div className="flex items-center gap-2">
    <FaClock className="text-blue-500" />
    <p><strong>Start Time:</strong> {new Date(editableEvent?.start).toLocaleString()}</p>
  </div>

  <div className="flex items-center gap-2">
    <FaClock className="text-blue-500" />
    <p><strong>End Time:</strong> {new Date(editableEvent?.end).toLocaleString()}</p>
  </div>

  <div className="flex items-center gap-2">
    <FaCheckCircle className="text-blue-500" />
    <p><strong>Status:</strong> {editableEvent?.status || 'Not set'}</p>
  </div>

  <div className="flex items-center gap-2">
  <FaStickyNote className="text-blue-500" />
  <p><strong>Notes:</strong></p>
  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(editableEvent?.notes || 'No notes available') }} />
</div>
  
      <div className="flex items-center gap-2">
        <FaSyncAlt className="text-blue-500" />
        <p>
          <strong>Repeat:</strong> {editableEvent?.repeat_frequency || 'Not set'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <FaCalendarAlt className="text-blue-500" />
        <p>
          <strong>Task Period:</strong> {editableEvent?.task_period || 'Not set'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <FaCogs className="text-blue-500" />
        <p><strong>Machine:</strong> {getMachineName(editableEvent?.machine )}</p>
      </div>

      <div className="flex items-center gap-2">
        <FaBuilding className="text-blue-500" />
        <p><strong>Facility:</strong> {getFacilityName(editableEvent?.facility)}</p>
      </div>

      <div className="flex items-center gap-2">
        <FaBoxOpen className="text-blue-500" />
        <p><strong>Materials:</strong> {getMaterialNames(editableEvent?.materials)}</p>
      </div>

      <div className="flex items-center gap-2">
        <FaWrench className="text-blue-500" />
        <p><strong>Tools:</strong> {getToolNames(editableEvent?.tools)}</p>
      </div>

      <div className="flex items-center gap-2">
        <FaUserAlt className="text-blue-500" />
        <p><strong>Assigned to:</strong> {getUserNames(editableEvent?.assigned_to)}</p>
      </div>
</div>

         )}

      <div className="flex justify-between mt-6">
           {isEditMode && (
             <div className='flex md:flex-row '>
               <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
              >
                Save Changes
              </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventDetailsModal;
             
