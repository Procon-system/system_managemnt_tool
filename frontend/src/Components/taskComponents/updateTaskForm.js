
// import { useState, useEffect } from 'react';
// import { FaClock, FaStickyNote, FaCheckCircle } from 'react-icons/fa';
// // import { getUsersByIds } from '../../features/userSlice';  // Import your API call for getting user by ID
// import { useDispatch} from 'react-redux';

// const EventDetailsModal = ({
//   isVisible,
//   closeModal,
//   selectedEvent,
//   role,
//   handleDelete,
//   handleFormSubmit,
// }) => {
//   const dispatch = useDispatch();
//   // const [assignedUsers, setAssignedUsers] = useState([]); // State to store full user details
//   useEffect(() => {
//     // Fetch user details when the modal is visible and selectedEvent is set
//     // const fetchAssignedUsers = async () => {
//     //   if (selectedEvent && selectedEvent.assigned_to) {
//     //     const users = await Promise.all(
//     //       selectedEvent.assigned_to.map(async (userId) => {
//     //         const user = dispatch(getUsersByIds(userId));
//     //         return user; // Return full user info for each assigned user
//     //       })
//     //     );
//     //     setAssignedUsers(users);
//     //   }
//     // };

//     // if (isVisible) {
//     //   fetchAssignedUsers(); // Fetch users when modal is shown
//     // }
//   }, [dispatch, isVisible, selectedEvent]);  // Re-run if isVisible or selectedEvent changes

//   const onSubmit = (e) => {
//     e.preventDefault();
//     const updatedEvent = {
//       ...selectedEvent,
//       status: e.target.status?.value,
//       notes: e.target.notes?.value,
//     };

//     if (role >= 3) {
//       updatedEvent.title = e.target.title?.value;
//       updatedEvent.start_time = e.target.start?.value;
//       updatedEvent.end_time = e.target.end?.value;
//     }

//     const imageFile = e.target.image?.files[0]; // Access the uploaded image file
//     if (imageFile) {
//       updatedEvent.image = imageFile;
//     }

//     handleFormSubmit(updatedEvent); // Pass updated event data to the handler
//   };

//   const [isEditMode, setIsEditMode] = useState(false);

//   const toggleEditMode = () => {
//     setIsEditMode((prev) => !prev);
//   };

//   if (!isVisible || !selectedEvent) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="relative bg-white p-6 rounded-lg max-w-lg w-full">
//         <button
//           type="button"
//           onClick={closeModal}
//           className="absolute top-2 right-2 text-red-700 hover:text-red-900 text-2xl font-bold transition-transform transform hover:scale-110"
//           aria-label="Close"
//         >
//           &times;
//         </button>

//         <form onSubmit={onSubmit} className="space-y-4 mt-6">
//           <div className="flex justify-between items-center">
//             <h3 className="font-semibold bg-blue-400 text-white px-5 py-1 rounded-md hover:bg-blue-400">
//               Event Information
//             </h3>
//             {role >= 3 && (
//             <button
//                type="button"
//                className="bg-red-700 md:ml-[100px] text-white px-4 py-1 rounded-md hover:bg-red-600 transition"
//                onClick={() => handleDelete(selectedEvent._id)}
//              >
//                Delete
//              </button>
//             )}
//             <button
//               type="button"
//               onClick={toggleEditMode}
//               className="bg-blue-400 text-white px-5 py-1 mr-2 rounded-md hover:bg-blue-600 transition"
//             >
//               {isEditMode ? 'Cancel' : 'Edit'}
//             </button>
//           </div>

//           {/* Conditional rendering based on edit mode */}
//           {isEditMode ? (
//             <>
//               {role >= 3 && (
//                 <>
//                   <div>
//                     <label className="block mb-1 text-sm font-medium">Title:</label>
//                     <input
//                       type="text"
//                       name="title"
//                       defaultValue={selectedEvent.title}
//                       className="w-full px-3 py-2 border rounded-md"
//                     />
//                   </div>

//                   <div>
//                     <label className="block mb-1 text-sm font-medium">Start Time:</label>
//                     <input
//                       type="datetime-local"
//                       name="start"
//                       defaultValue={new Date(selectedEvent.start).toLocaleDateString("en-CA") + "T" + new Date(selectedEvent.start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}
//                       className="w-full px-3 py-2 border rounded-md"
//                     />
//                   </div>

//                   <div>
//                     <label className="block mb-1 text-sm font-medium">End Time:</label>
//                     <input
//                       type="datetime-local"
//                       name="end"
//                       defaultValue={new Date(selectedEvent.end).toLocaleDateString("en-CA") + "T" + new Date(selectedEvent.end).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}
//                       className="w-full px-3 py-2 border rounded-md"
//                     />
//                   </div>
                  
//                 </>
//               )}

//               {role >= 2 && (
//                 <div>
//                   <label className="block mb-1 text-sm font-medium">Status:</label>
//                   <select
//                     name="status"
//                     defaultValue={selectedEvent.status || 'pending'}
//                     className="w-full px-3 py-2 border rounded-md"
//                   >
//                     <option value="pending">Pending</option>
//                     <option value="in progress">In progress</option>
//                     <option value="done">Done</option>
//                     <option value="impossible">Impossible</option>
//                     <option value="overdue">Overdue</option>
//                   </select>

//                   <label className="block mb-1 text-sm font-medium">Note:</label>
//                   <textarea
//                     name="notes"
//                     defaultValue={selectedEvent.notes}
//                     className="w-full px-3 py-2 border rounded-md"
//                   />
//                   <div>
//                     <label className="block mb-1 text-sm font-medium">Upload Image:</label>
//                     <input
//                       type="file"
//                       name="image"
//                       className="w-full px-3 py-2 border rounded-md"
//                     />
//                   </div>
                 
//                 </div>
                
//               )}
//             </>
//           ) : (
//             <div className="space-y-4">
//               <div className="flex items-center justify-center gap-2">
//                 <p className="text-center font-bold">{selectedEvent.title}</p>
//               </div>

//               <div className="flex items-center gap-2">
//                 {selectedEvent.image ? (
//                   <img
//                     src={`http://localhost:5000/api/tasks/get-image/${selectedEvent._id}`}
//                     alt={selectedEvent.title || 'Event Image'}
//                     className="w-[1000px] h-[400px] object-cover"
//                   />
//                 ) : (
//                   <p>No image available</p>
//                 )}
//               </div>

//               {/* <div className="flex flex-col items-center justify-center gap-2">
//                 {assignedUsers.map((user, index) => (
//                   <p key={index} className="text-center font-bold">
//                     {user.first_name && user.last_name
//                       ? `${user.first_name} ${user.last_name}`
//                       : "Unknown User"}
//                   </p>
//                 ))}
//               </div> */}

//               <div className="flex items-center gap-2">
//                 <FaClock className="text-blue-500" />
//                 <p><strong>Start Time:</strong> {new Date(selectedEvent.start).toLocaleString()}</p>
//               </div>

//               <div className="flex items-center gap-2">
//                 <FaClock className="text-blue-500" />
//                 <p><strong>End Time:</strong> {new Date(selectedEvent.end).toLocaleString()}</p>
//               </div>

//               <div className="flex items-center gap-2">
//                 <FaCheckCircle className="text-blue-500" />
//                 <p><strong>Status:</strong> {selectedEvent.status || 'Not set'}</p>
//               </div>

//               <div className="flex items-center gap-2">
//                 <FaStickyNote className="text-blue-500" />
//                 <p><strong>Notes:</strong> {selectedEvent.notes || 'No notes available'}</p>
//               </div>
//             </div>
//           )}

//           <div className="flex justify-between mt-6">
//             {isEditMode && (
//              <div className='flex md:flex-row '>
//                <button
//                 type="submit"
//                 className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
//               >
//                 Save Changes
//               </button>
//               </div>
//             )}
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default EventDetailsModal;
import { useState, useEffect } from 'react';
import { FaClock, FaStickyNote, FaCheckCircle, FaSyncAlt, FaCalendarAlt, FaCogs, FaBuilding, FaWrench, FaBoxOpen, FaUserAlt  } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import RichTextEditor from './richTextEditor';
import {SelectInput,SelectTaskPeriodInput} from './selectInput';
import { fetchTools } from '../../features/toolsSlice'; // Redux action to fetch tools
import { fetchMaterials } from '../../features/materialsSlice'; // Redux action to fetch materials
import { fetchFacilities } from '../../features/facilitySlice'; // Redux action to fetch facilities
import { fetchMachines } from '../../features/machineSlice'; // Redux action to fetch machines
import { getUsers } from '../../features/userSlice';
const EventDetailsModal = ({
  isVisible,
  closeModal,
  selectedEvent,
  role,
  handleDelete,
  handleFormSubmit,
}) => {
  const dispatch = useDispatch();
  useEffect(() => {
  }, [dispatch, isVisible, selectedEvent]); // Re-run if isVisible or selectedEvent changes
console.log("selecetdevevnt",selectedEvent)
  const onSubmit = (e) => {
    e.preventDefault();
    const updatedEvent = {
      ...selectedEvent,
      status: e.target.status?.value,
      notes: e.target.notes?.value,
      repeat_frequency: e.target.repeat_frequency?.value,
      task_period: e.target.task_period?.value,
      machine: e.target.machine?.value,
      facility: e.target.facility?.value,
      assigned_to: selectedEvent.assigned_to || [],
      tools: selectedEvent.tools || [],
      materials: selectedEvent.materials || [],
    };

    if (role >= 3) {
      updatedEvent.title = e.target.title?.value;
      updatedEvent.start_time = e.target.start?.value;
      updatedEvent.end_time = e.target.end?.value;
    }

    const imageFile = e.target.image?.files[0]; // Access the uploaded image file
    if (imageFile) {
      updatedEvent.image = imageFile;
    }

    handleFormSubmit(updatedEvent); // Pass updated event data to the handler
  };

  const [isEditMode, setIsEditMode] = useState(false);

  const toggleEditMode = () => {
    setIsEditMode((prev) => !prev);
  };

  if (!isVisible || !selectedEvent) return null;

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
                onClick={() => handleDelete(selectedEvent._id)}
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
                      defaultValue={selectedEvent.title}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">Start Time:</label>
                    <input
                      type="datetime-local"
                      name="start"
                      defaultValue={
                        new Date(selectedEvent.start).toLocaleDateString("en-CA") +
                        "T" +
                        new Date(selectedEvent.start).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">End Time:</label>
                    <input
                      type="datetime-local"
                      name="end"
                      defaultValue={
                        new Date(selectedEvent.end).toLocaleDateString("en-CA") +
                        "T" +
                        new Date(selectedEvent.end).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">Repeat Frequency:</label>
                    <input
                      type="text"
                      name="repeat_frequency"
                      defaultValue={selectedEvent.repeat_frequency || ''}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">Task Period:</label>
                    <input
                      type="text"
                      name="task_period"
                      defaultValue={selectedEvent.task_period || ''}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">Machine:</label>
                    <input
                      type="text"
                      name="machine"
                      defaultValue={selectedEvent.machine || ''}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">Facility:</label>
                    <input
                      type="text"
                      name="facility"
                      defaultValue={selectedEvent.facility || ''}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div> <label className="block mb-1 text-sm font-medium">Assigned To:</label>
                  <input
                    type="text"
                    name="assigned_to"
                    defaultValue={selectedEvent.assigned_to?.length > 0 
                      ? selectedEvent.assigned_to.map((user) => `${user.first_name} ${user.last_name}`).join(', ') 
                      : 'Not set'}
                    className="w-full px-3 py-2 border rounded-md"
                  />
</div>
                  <div>
                  <label className="block mb-1 text-sm font-medium">Tools:</label>
                  <input
                    type="text"
                    name="tools"
                    defaultValue= {selectedEvent.tools?.length > 0 
                      ? selectedEvent.tools.map((tool) => tool.tool_name).join(', ') 
                      : 'Not set'}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  </div>
                 

                 <div>
                 <label className="block mb-1 text-sm font-medium">Materials:</label>
                  <input
                    type="text"
                    name="materials"
                    defaultValue={selectedEvent.materials?.length > 0 
                      ? selectedEvent.materials.map((material) => material.material_name).join(', ') 
                      : 'Not set'}
                    className="w-full px-3 py-2 border rounded-md"
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
                      defaultValue={selectedEvent.status || 'pending'}
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
                      className="w-full px-3 py-1 border rounded-md"
                    />
                  </div>
                 

                 
                </div>
                <div>
                    <label className="block mb-1 text-sm font-medium">Note:</label>
                    {/* <textarea
                      name="notes"
                      defaultValue={selectedEvent.notes}
                      className="w-full px-3 py-2 border rounded-md"
                    /> */}
                    <RichTextEditor value={selectedEvent.notes} />
                  </div>
                </div>
                
              )}
            </>
          ): (
            <div className="grid grid-cols-2 gap-4">
  <div className="flex items-center justify-center col-span-2">
    <p className="text-center font-bold">{selectedEvent.title}</p>
  </div>

  <div className="col-span-2 flex justify-center">
    {selectedEvent.image ? (
      <img
        src={`http://localhost:5000/api/tasks/get-image/${selectedEvent._id}`}
        alt={selectedEvent.title || 'Event Image'}
        className="w-[500px] h-[250px] object-cover"
      />
    ) : (
      <p>No image available</p>
    )}
  </div>

  <div className="flex items-center gap-2">
    <FaClock className="text-blue-500" />
    <p><strong>Start Time:</strong> {new Date(selectedEvent.start).toLocaleString()}</p>
  </div>

  <div className="flex items-center gap-2">
    <FaClock className="text-blue-500" />
    <p><strong>End Time:</strong> {new Date(selectedEvent.end).toLocaleString()}</p>
  </div>

  <div className="flex items-center gap-2">
    <FaCheckCircle className="text-blue-500" />
    <p><strong>Status:</strong> {selectedEvent.status || 'Not set'}</p>
  </div>

  <div className="flex items-center gap-2">
    <FaStickyNote className="text-blue-500" />
    <p><strong>Notes:</strong> {selectedEvent.notes || 'No notes available'}</p>
  </div>
  
      <div className="flex items-center gap-2">
        <FaSyncAlt className="text-blue-500" />
        <p>
          <strong>Repeat:</strong> {selectedEvent.repeat_frequency || 'Not set'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <FaCalendarAlt className="text-blue-500" />
        <p>
          <strong>Task Period:</strong> {selectedEvent.task_period || 'Not set'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <FaCogs className="text-blue-500" />
        <p>
          <strong>Machine:</strong> {selectedEvent.machine || 'Not set'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <FaBuilding className="text-blue-500" />
        <p>
          <strong>Facility:</strong> {selectedEvent.facility || 'Not set'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <FaBoxOpen className="text-blue-500" />
        <p>
          <strong>Materials:</strong>{' '}
          {selectedEvent.materials?.length > 0
            ? selectedEvent.materials.map((material) => material.material_name).join(', ')
            : 'Not set'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <FaWrench className="text-blue-500" />
        <p>
          <strong>Tools:</strong>{' '}
          {selectedEvent.tools?.length > 0
            ? selectedEvent.tools.map((tool) => tool.tool_name).join(', ')
            : 'Not set'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <FaUserAlt className="text-blue-500" />
        <p>
          <strong>Assigned to:</strong>{' '}
          {selectedEvent.assigned_to?.length > 0
            ? selectedEvent.assigned_to.map((user) => `${user.first_name} ${user.last_name}`).join(', ')
            : 'Not set'}
        </p>
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
             
