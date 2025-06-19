

import { useState, useEffect} from 'react';
import { useSelector } from 'react-redux';
import RichTextEditor from './richTextEditor';
import {SelectInput,SelectTaskPeriodInput} from './selectInput';

import ImageSlider from './imageSlider';
import { useResources } from '../../hooks/useResources';
import { useUsers } from '../../hooks/useUsers';
import {getTimezoneOffsetHours} from '../../Helper/getTimezones';
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    // Pad single digit month/day/hour/minute with a leading zero
    const pad = (num) => num.toString().padStart(2, '0');
    
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error("Invalid date for formatting:", dateString);
    return '';
  }
};
const adjustTimeForBackend = (time, timezoneInput) => {
  try {
    // Validate time
    const date = new Date(time);
    if (isNaN(date.getTime())) {
      console.error('Invalid date input:', time);
      return null;
    }

    // Get offset in hours (handles both numbers and timezone names)
    const timezoneOffset = getTimezoneOffsetHours(timezoneInput);
    
    // Calculate adjusted time
    const utcTime = date.getTime();
    const adjustedTime = new Date(utcTime + timezoneOffset * 60 * 60 * 1000);

    if (isNaN(adjustedTime.getTime())) {
      console.error('Invalid adjusted time:', adjustedTime);
      return null;
    }

    return adjustedTime.toISOString();
  } catch (error) {
    console.error('Error adjusting time:', error);
    return null;
  }
};
const EventDetailsModal = ({
  isVisible,
  closeModal,
  selectedEvent,
  role,
  handleDelete,
  handleFormSubmit,
}) => {
   
   const { resourceTypes } = useSelector((state) => state.resourceTypes);

const typeIds = resourceTypes?.map(type => type._id) || [];
   const { users = [] } = useUsers();
   const { getResourcesByType } = useResources(typeIds);
 
useEffect(() => {
  setEditableEvent(selectedEvent || {});
}, [selectedEvent]);

// const handleChange = (e) => {
//   const { name, value } = e.target;

//   setEditableEvent((prev) => ({
//     ...prev,
//     [name]: Array.isArray(value) ? [...value] : value, // Ensure arrays are stored properly
//   }));
// };
const handleChange = (e) => {
  const { name, value } = e.target;
  let processedValue;

  // Case 1: Handle the date inputs specifically.
  if (name === 'start' || name === 'end') {
    // Convert the timezone-naive string from the input into a proper local Date object.
    processedValue = new Date(value);
  
  // Case 2: Handle multi-select inputs that pass an array of values.
  } else if (Array.isArray(value)) {
    // Create a new array to ensure React recognizes the state change.
    processedValue = [...value];

  // Case 3: Handle all other standard inputs (text, single-select, etc.).
  } else {
    processedValue = value;
  }

  // Finally, update the state ONCE with the correctly processed value.
  setEditableEvent((prev) => ({
    ...prev,
    [name]: processedValue,
  }));
};


    const [newImages, setNewImages] = useState([]); // Store new images for preview
   const [editableEvent, setEditableEvent] = useState(selectedEvent || {});
  const [images, setImages] = useState([]);
  const token = useSelector(state => state.auth.token);

  useEffect(() => {
    const fetchImages = async () => {
      if (!editableEvent?.images?.length) return;
  
      try {
        const queryParam = editableEvent.images.join(',');
        const res = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/tasks/images/bulk?fileIds=${queryParam}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
  
        if (data.success) {
          const imageBlobs = await Promise.all(
            data.data.map(async (img) => {
              try {
                const response = await fetch(
                  `${process.env.REACT_APP_API_BASE_URL}/api/tasks/image/${img.fileId}`,
                  {
                    method: 'GET',
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );
        
                if (!response.ok) throw new Error('Failed to fetch image');
                
               
                const blob = await response.blob();
               
                
                if (blob.size === 0) {
                  throw new Error('Received empty blob');
                }
                
                const objectUrl = URL.createObjectURL(blob);
                console.log("Object URL created:", objectUrl);
        
                return {
                  url: objectUrl,
                  contentType: img.contentType,
                  filename: img.filename,
                };
              } catch (err) {
                console.error(`Failed to load image ${img.fileId}`, err);
                return null;
              }
            })
          );
        
          console.log("Final image blobs:", imageBlobs);
          setImages(imageBlobs.filter(Boolean));
        }
      } catch (err) {
        console.error("Error fetching image metadata:", err);
      }
    };
  
    fetchImages();
  
    // Cleanup function
    return () => {
      images.forEach(img => {
        if (img?.url) URL.revokeObjectURL(img.url);
      });
    };
  }, [editableEvent]);
 

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setNewImages([...newImages, ...files]);
  };

  const handleRemoveImage = (image) => {
    setImages((prevImages) => prevImages.filter((img) => img !== image));
  };

  const handleRemoveNewImage = (index) => {
    setNewImages((prevNewImages) => prevNewImages.filter((_, i) => i !== index));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    // 1. Get the user's timezone, exactly like in handleEventResize
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const fallbackTimezoneOffset = new Date().getTimezoneOffset() / -60;
  const timezoneToUse = userTimezone || fallbackTimezoneOffset;

  // 2. Call the adjustment function on the Date objects from our state
  // This is the CRUCIAL step that mirrors your working code.
  const adjustedStartTime = adjustTimeForBackend(editableEvent.start, timezoneToUse);
  const adjustedEndTime = adjustTimeForBackend(editableEvent.end, timezoneToUse);

    // Prepare the complete payload
    const payload = {
      ...editableEvent,
      images: images, // Current images
      newImages: newImages, // Newly uploaded images
      // Ensure dates are properly formatted if needed
      start: adjustedStartTime, // Use the adjusted time
    end: adjustedEndTime, 
            assigned_resources: editableEvent.assigned_resources,
      notes: editableEvent.notes,
      repeat_frequency: editableEvent.repeat_frequency,
      task_period: editableEvent.task_period
    };
  
    // Remove any undefined or null values
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v != null)
    );
    handleFormSubmit(cleanPayload);
  };
  const [isEditMode, setIsEditMode] = useState(false);

  const toggleEditMode = () => {
    setIsEditMode((prev) => !prev);
  };

  if (!isVisible || !editableEvent) return null;
  if (!editableEvent) {
    return <p>Loading event details...</p>;  // Show a loading message instead of crashing
  }
  
  const chunkArray = (array, size) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
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
          <h3 className="font-semibold bg-blue-200 text-gray-800 px-5 py-1 rounded-md hover:bg-blue-300 border-y-2 border-blue-400">
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
              className="mr-2  bg-blue-200 text-gray-800 px-5 py-1 rounded-md hover:bg-blue-300 border-y-2 border-blue-400 transition"
            >
              {isEditMode ? 'Cancel' : 'Edit'}
            </button>
            </div>
          </div>

          {/* Conditional rendering based on edit mode */}
          {isEditMode ? (
              <>
            {isEditMode && (
  <div className="max-h-[80vh] overflow-y-auto p-4 bg-gray-50 rounded-lg shadow-inner">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

      {/* Title */}
      {role >= 3 && (
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
      )}

      {/* Start Time */}
      {role >= 2 && (
       <div>
       <label className="block mb-1 text-sm font-medium">Start Time:</label>
       <input
         type="datetime-local"
         name="start"
         // Use value and the new helper function
         value={formatDateForInput(editableEvent?.start)}
         onChange={handleChange}
         className="w-full px-3 py-2 border rounded-md"
       />
     </div>
      )}

      {/* End Time */}
      {role >= 2 && (
       <div>
       <label className="block mb-1 text-sm font-medium">End Time:</label>
       <input
         type="datetime-local"
         name="end"
         // Use value and the new helper function
         value={formatDateForInput(editableEvent?.end)}
         onChange={handleChange}
         className="w-full px-3 py-2 border rounded-md"
       />
     </div>
      )}

      {/* Frequency */}
      {role >= 2 && (
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
      )}

      {/* Task Period */}
      {role >= 2 && (
        <div>
          <SelectTaskPeriodInput
            label="Task Period"
            name="task_period"
            value={editableEvent?.task_period}
            onChange={handleChange}
            required
          />
        </div>
      )}

      
      {/* Status */}
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
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
            <option value="impossible">Impossible</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      )}

      {/* Upload Images */}
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

    {/* Image Previews */}
    {role >= 2 && (
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Current Images */}
        <div>
          <h3 className="text-sm font-semibold mb-2 bg-blue-400 text-white px-4 py-1 rounded-md">Current Images:</h3>
          <div className="flex flex-wrap gap-2">
            {images.map((image, index) => (
              <div key={index} className="relative w-24 h-24">
                 <img
              src={image.url || image.base64 || image}
              alt={image.filename || `Image ${index + 1}`}  className="w-full h-full object-cover rounded-md" />
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

        {/* New Images */}
        <div>
          <h3 className="text-sm font-semibold mb-2 bg-blue-400 text-white px-4 py-1 rounded-md">New Images:</h3>
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

    {/* Resources Section */}
   
{role >= 3 && resourceTypes && (
  <div className="mt-6">
    <h2 className="text-lg font-semibold mb-3">Resources</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Assigned People */}
      <div className="border rounded-lg p-4 bg-white">
        <SelectInput
          label="Assigned People"
          name="assigned_resources.assigned_to"
          value={editableEvent?.assigned_resources?.assigned_to?.map(u => u.id) || []}
          onChange={(e) => {
            const selectedUserIds = e.target.value || [];
            const selectedUsers = selectedUserIds.map(id => 
              users.find(u => u._id === id)
            );
            
            setEditableEvent(prev => ({
              ...prev,
              assigned_resources: {
                ...prev.assigned_resources,
                assigned_to: selectedUsers
              }
            }));
          }}
          options={users?.map(u => ({ label: u.full_name, value: u._id })) || []}
          isMulti
        />
      </div>

      {/* Resources by Type */}
      {resourceTypes.map(type => {
        const availableResources = getResourcesByType(type._id) || [];
        const currentResourcesForType = editableEvent?.assigned_resources?.resources
          ?.filter(res => res.resource?.type?._id === type._id)
          ?.map(res => res.resource._id) || [];

        return (
          <div key={type._id} className="border rounded-lg p-4 bg-white">
            <SelectInput
              label={type.name}
              name={`resources_${type._id}`}
              value={currentResourcesForType}
              onChange={(e) => {
                const selectedResourceIds = e.target.value || [];
                
                // Keep resources of other types
                const otherResources = editableEvent?.assigned_resources?.resources?.filter(
                  res => res.resource?.type?._id !== type._id
                ) || [];

                // Create new resource objects for selected ones
                const newResources = selectedResourceIds.map(resourceId => {
                  const resource = availableResources.find(r => r._id === resourceId);
                  
                  return {
                    _id: resource._id,
                    relationshipType: "requires",
                    required: false,
                    resource: {
                      _id: resourceId,
                      type: type,
                      displayName: resource?.displayName,
                      ...resource
                    }
                  };
                });

                setEditableEvent(prev => ({
                  ...prev,
                  assigned_resources: {
                    ...prev.assigned_resources,
                    resources: [...otherResources, ...newResources]
                  }
                }));
              }}
              options={availableResources.map(r => ({
                label: r.displayName || r.name,
                value: r._id
              }))}
              isMulti
            />
            {type.description && (
              <p className="text-xs text-gray-500 mt-2">{type.description}</p>
            )}
          </div>
        );
      })}
    </div>
  </div>
)}
    {/* Notes */}
    {role >= 2 && (
      <div className="mt-6">
        <label className="block mb-1 text-sm font-medium">Note:</label>
        <RichTextEditor
          value={editableEvent?.notes}
          onChange={(value) => handleChange({ target: { name: "notes", value } })}
        />
      </div>
    )}
  </div>
)}

            </>
          ): (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-gray-50">
            {/* Title */}
            {editableEvent?.title && (
              <div className="col-span-full flex justify-center">
                <p className="text-2xl font-bold text-gray-800">{editableEvent.title}</p>
              </div>
            )}
          
            {/* Image Slider */}
            {images.length > 0 && (
  <div className="col-span-full flex justify-center">
    <ImageSlider images={images} />
  </div>
)}
          
            {/* Start, End, Status */}
            <div className="bg-blue-100 shadow-md rounded-xl p-4 transform rotate-[-1deg] space-y-2">
              <p className="font-bold text-lg text-gray-800">🕒 Event Timing</p>
              <p><strong>Start:</strong> {new Date(editableEvent?.start).toLocaleString()}</p>
              <p><strong>End:</strong> {new Date(editableEvent?.end).toLocaleString()}</p>
              <p><strong>Status:</strong> {editableEvent?.status || 'pending'}</p>
            </div>
          
            {/* Repeat + Assigned To */}
            <div className="bg-gray-200 shadow-md rounded-xl p-4 transform rotate-[1deg] space-y-2">
              <p className="font-bold text-lg text-gray-800">🔁 Assignment</p>
              <p><strong>Repeat:</strong> {editableEvent?.repeat_frequency || 'none'}</p>
              <div>
                <p className="font-semibold">Assigned To:</p>
                {editableEvent?.assigned_resources?.assigned_to?.map(user => (
                  <div key={user._id} className="text-sm">
                    {user.name || user.email} {user.role && `(${user.role})`}
                  </div>
                ))}
              </div>
            </div>
          
            {/* Resources */}
            {editableEvent?.assigned_resources?.resources?.length > 0 &&
  chunkArray(editableEvent.assigned_resources.resources, 3).map((chunk, index) => (
    <div
      key={index}
      className={`bg-blue-100 shadow-md rounded-xl p-4 space-y-2 transform ${
        index % 2 === 0 ? 'rotate-[-2deg]' : 'rotate-[1deg]'
      }`}
    >
      <p className="font-bold text-lg text-gray-800">
        📦 Resources {chunk.length < 3 ? '' : `(# ${index + 1})`}
      </p>
      {chunk.map(resource => (
        <div key={resource._id} className="text-sm">
          <strong>{resource.resource?.type?.name || 'Type'}:</strong>{' '}
          {resource.resource?.displayName || 'Unnamed'}
          {resource.required && (
            <span className="text-xs text-red-600 ml-2">(required)</span>
          )}
        </div>
      ))}
    </div>
  ))}

          
            {/* Notes */}
            <div className="bg-gray-200 shadow-md rounded-xl p-4 transform rotate-[2deg] space-y-2 col-span-full">
              <p className="font-bold text-lg text-gray-900">📝 Notes</p>
              <div className="rounded text-sm min-h-[40px]">
                {editableEvent?.notes || 'No notes available'}
              </div>
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
             
