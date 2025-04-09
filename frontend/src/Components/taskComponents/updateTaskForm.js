

import { useState, useEffect } from 'react';

import { useDispatch,useSelector } from 'react-redux';
import RichTextEditor from './richTextEditor';
import {SelectInput,SelectTaskPeriodInput} from './selectInput';
import DOMPurify from "dompurify";
import ImageSlider from './imageSlider';
import { fetchImageMetadata, fetchImageFile } from '../../features/taskSlice'; // Adjust path as needed

import {localDB} from '../../pouchDb';
const EventDetailsModal = ({
  isVisible,
  closeModal,
  selectedEvent,
  role,
  handleDelete,
  handleFormSubmit,
}) => {
  
  const [editableEvent, setEditableEvent] = useState(selectedEvent || {});
  const dispatch = useDispatch();
console.log("selectedEvent",selectedEvent)
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
   const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]); // Store new images for preview

  useEffect(() => {
    const fetchImages = async () => {
      if (editableEvent?._id) {
        if (navigator.onLine) {
          try {
            // 1. Fetch image metadata (this gives us fileIds)
            const metaResult = await dispatch(fetchImageMetadata({ fileIds: [editableEvent._id] }));
    
            if (fetchImageMetadata.fulfilled.match(metaResult)) {
              const imageFileIds = metaResult.payload?.images || [];
    
              // 2. Fetch image blobs for each image
              const imageBlobResults = await Promise.all(
                imageFileIds.map(async (fileId) => {
                  const fileResult = await dispatch(fetchImageFile({ fileId }));
                  if (fetchImageFile.fulfilled.match(fileResult)) {
                    const { blob } = fileResult.payload;
                    return URL.createObjectURL(blob);
                  } else {
                    console.error('Failed to fetch image file', fileResult.payload);
                    return null;
                  }
                })
              );
    
              const validUrls = imageBlobResults.filter(Boolean);
              setImages(validUrls);
            }
          } catch (error) {
            console.error("Error fetching task or images:", error);
            // Optionally show error to user
            // toast.error("Failed to load images. Please try again.");
          } 
        } else {
          try {
            // Fetch the task document from PouchDB
            const taskDoc = await localDB.get(editableEvent._id);
            console.log("Fetched task document from PouchDB:", taskDoc);
  
            if (taskDoc._attachments) {
              // Get all image attachments
              const imageNames = Object.keys(taskDoc._attachments);
              const imageUrls = await Promise.all(
                imageNames.map(async (name) => {
                  const blob = await localDB.getAttachment(editableEvent._id, name);
                  return URL.createObjectURL(blob); // Convert Blob to URL
                })
              );
              console.log("Generated local image URLs:", imageUrls);
              setImages(imageUrls); // Store the image URLs array
            }
          } catch (error) {
            console.error("Error fetching images from PouchDB:", error);
          }
        }
      }
    };
  
    fetchImages(); // Call the async function inside useEffect
  }, [editableEvent?._id]); // Dependency array

  
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
          
                </div>
              )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-gray-50">
            {/* Title */}
            {editableEvent?.title && (
              <div className="col-span-full flex justify-center">
                <p className="text-2xl font-bold text-gray-800">{editableEvent.title}</p>
              </div>
            )}
          
            {/* Image Slider */}
            {editableEvent?.images?.length > 0 && (
              <div className="col-span-full flex justify-center">
                <ImageSlider images={editableEvent.images} />
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
             
