

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
import ImageSlider from './imageSlider';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

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
  const { name, value } = e.target;
  
  setEditableEvent((prev) => ({
    ...prev,
    [name]: Array.isArray(value) ? [...value] : value, // Ensure arrays are stored properly
  }));
};


  // Fetch Data from Redux Store
  const { users } = useSelector((state) => state.users);
  const { tools } = useSelector((state) => state.tools);
  const { materials } = useSelector((state) => state.materials);
  const { facilities } = useSelector((state) => state.facilities);
  const { machines } = useSelector((state) => state.machines);
  const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]); // Store new images for preview
  useEffect(() => {
    if (editableEvent?._id) {
      fetch( `${API_BASE_URL}/tasks/get-images/${editableEvent._id}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.images)) {
            setImages(data.images); // Store the image URLs array
          }
        })
        .catch((error) => console.error("Error fetching images:", error));
    }
  }, [editableEvent?._id]);

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
        const foundTool = tools?.find((t) => t._id === tool);
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
            const foundMaterial = materials?.find((m) => m._id === material);
            return foundMaterial ? foundMaterial.material_name : "Unknown Material";
          })
          .join(", ") || "Not set";
      
  const getFacilityName = (id) => {
        const facility = facilities?.find((f) => f._id === id);
        return facility ? facility.facility_name : 'Unknown Facility';
      };
    
  const getMachineName = (id) => {
        const machine = machines?.find((m) => m._id === id);
        return machine ? machine.machine_name : 'Unknown Machine';
      };
      const machineOptions = machines?.map(machine => ({
        label: machine.machine_name,
        value: machine._id
      }));
      
      const facilityOptions = facilities?.map(facility => ({
        label: facility.facility_name,
        value: facility._id
      }));
      
      
      const toolOptions = tools?.map(tool => ({
        label: tool.tool_name,
        value: tool._id
      }));
      
      const materialOptions = materials?.map(material => ({
        label: material.material_name,
        value: material._id
      }));
      const userOptions = users?.map(user => ({
        label: `${user.first_name} ${user.last_name}`, // Use backticks
        value: user._id
      }));
    
  const [isEditMode, setIsEditMode] = useState(false);

  const toggleEditMode = () => {
    setIsEditMode((prev) => !prev);
  };

  if (!isVisible || !editableEvent) return null;
  if (!editableEvent) {
    return <p>Loading event details...</p>;  // Show a loading message instead of crashing
  }
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setNewImages([...newImages, ...files]); // Append new files
  };
  const handleRemoveImage = (image) => {
    setImages((prevImages) => prevImages.filter((img) => img !== image));
  };
  
  const handleRemoveNewImage = (index) => {
    setNewImages((prevNewImages) => prevNewImages.filter((_, i) => i !== index));
  };
  
  const onSubmit = (e) => {
    e.preventDefault();
    handleFormSubmit({ 
      ...editableEvent, 
      images, 
      newImages, 
    });
  };
  
 
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="relative bg-white p-6 rounded-lg max-w-5xl w-full">
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
                <div className="grid md:grid-cols-4 grid-cols-3 md:gap-4 gap-1">
                  {/* Title */}
                  <div>
                    <label className="block mb-1 text-sm font-medium">Title:</label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={editableEvent?.title}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
          
                  {/* Start Time */}
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
          
                  {/* End Time */}
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
          
                  {/* Frequency */}
                  <div>
                    <SelectInput
                      label="Frequency"
                      name="repeat_frequency"
                      value={editableEvent?.repeat_frequency}
                      onChange={handleChange}
                      options={[
                        { label: "None", value: "none" },
                        { label: "Daily", value: "daily" },
                        { label: "Weekly", value: "weekly" },
                        { label: "Monthly", value: "monthly" },
                        { label: "Yearly", value: "yearly" },
                      ]}
                      required
                    />
                  </div>
          
                  {/* Task Period */}
                  <div>
                    <SelectTaskPeriodInput
                      label="Task Period"
                      name="task_period"
                      value={editableEvent?.task_period}
                      onChange={handleChange}
                      required
                    />
                  </div>
          
                  {/* Machine */}
                  <div>
                    <SelectInput
                      label="Machine"
                      name="machine"
                      value={editableEvent?.machine}
                      onChange={handleChange}
                      options={machineOptions}
                    />
                  </div>
          
                  {/* Facility */}
                  <div>
                    <SelectInput
                      label="Facility"
                      name="facility"
                      value={editableEvent?.facility}
                      onChange={handleChange}
                      options={facilityOptions}
                    />
                  </div>
          
                  {/* Assigned To */}
                  <div>
                    <SelectInput
                      label="Assigned To"
                      name="assigned_to"
                      value={editableEvent?.assigned_to || []}
                      onChange={handleChange}
                      options={userOptions}
                      isMulti={true}
                    />
                  </div>
          
                  {/* Tools */}
                  <div>
                    <SelectInput
                      label="Tools"
                      name="tools"
                      value={editableEvent?.tools || []}
                      onChange={handleChange}
                      options={toolOptions}
                      isMulti={true}
                    />
                  </div>
          
                  {/* Materials */}
                  <div>
                    <SelectInput
                      label="Materials"
                      name="materials"
                      value={editableEvent?.materials || []}
                      onChange={handleChange}
                      options={materialOptions}
                      isMulti={true}
                    />
                  </div>
          
                  {/* Status (Role ≥ 2) */}
                  {role >= 2 && (
                    <div>
                      <label className="block mb-1 text-sm font-medium">Status:</label>
                      <select
                        name="status"
                        defaultValue={editableEvent?.status || "pending"}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="pending">Pending</option>
                        <option value="in progress">In progress</option>
                        <option value="done">Done</option>
                        <option value="impossible">Impossible</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </div>
                  )}
          
                  {/* Upload Image (Role ≥ 2) */}
                  {role >= 2 && (
                    <div>
                      <label className="block text-sm font-medium">Upload Image:</label>
                      <input
                        type="file"
                        name="images"
                        multiple
                        onChange={handleFileChange}
                        className="w-full px-2 py-1 border rounded-md text-sm"
                      />
                    </div>
                  )}
                </div>
              )}
          
              {/* Image Previews (Role ≥ 2) */}
              {role >= 2 && (
                <div className="mt-3 p-3 border  rounded-md shadow-md grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2 bg-blue-400 text-white px-5 py-1 rounded-md hover:bg-blue-400">Current Images:</h3>
                    <div className="flex flex-wrap gap-2">
                      {images.map((image, index) => (
                        <div key={index} className="relative w-24 h-24">
                          <img src={image.base64 || image} alt="Preview" className="w-full h-full object-cover rounded-md" />
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleRemoveImage(image);
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white text-xs p-1 rounded-full"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
          
                  <div>
                    <h3 className="text-sm font-semibold mb-2 bg-blue-400 text-white px-5 py-1 rounded-md hover:bg-blue-400">New Images:</h3>
                    <div className="flex flex-wrap gap-2">
                      {newImages.map((file, index) => (
                        <div key={index} className="relative w-24 h-24">
                          <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover rounded-md" />
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleRemoveNewImage(index);
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white text-xs p-1 rounded-full"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
          
              {/* Notes Section */}
              {role >= 2 && (
                <div className="mt-3">
                  <label className="block mb-1 text-sm font-medium">Note:</label>
                  <RichTextEditor
                    value={editableEvent?.notes}
                    onChange={(value) => handleChange({ target: { name: "notes", value } })}
                  />
                </div>
              )}
            </>
          ): (
            <div className="grid grid-cols-2 gap-4">
  <div className="flex items-center justify-center col-span-2">
    <p className="text-center font-bold ">{editableEvent?.title}</p>
  </div>

 <div className=" col-span-2 flex justify-center ">
 <ImageSlider images={images} />
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
             
