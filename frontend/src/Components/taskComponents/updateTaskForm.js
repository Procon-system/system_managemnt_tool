
import { useState, useEffect } from 'react';
import { FaClock, FaStickyNote, FaCheckCircle } from 'react-icons/fa';
import { getUsersByIds } from '../../features/userSlice';  // Import your API call for getting user by ID
import { useDispatch} from 'react-redux';
const EventDetailsModal = ({
  isVisible,
  closeModal,
  selectedEvent,
  role,
  handleFormSubmit,
}) => {
  const dispatch = useDispatch();
  const [assignedUsers, setAssignedUsers] = useState([]); // State to store full user details

  useEffect(() => {
    // Fetch user details when the modal is visible and selectedEvent is set
    console.log("selected event",selectedEvent);
    const fetchAssignedUsers = async () => {
      if (selectedEvent && selectedEvent.assigned_to) {
        const users = await Promise.all(
          selectedEvent.assigned_to.map(async (userId) => {
            const user = dispatch(getUsersByIds(userId));
            return user; // Return full user info for each assigned user
          })
        );
        setAssignedUsers(users);
      }
    };

    if (isVisible) {
      fetchAssignedUsers(); // Fetch users when modal is shown
    }
  }, [dispatch, isVisible, selectedEvent]);  // Re-run if isVisible or selectedEvent changes

  const onSubmit = (e) => {
    e.preventDefault();
    const updatedEvent = {
      ...selectedEvent,
      status: e.target.status?.value,
      notes: e.target.notes?.value,
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
      <div className="relative bg-white p-6 rounded-lg max-w-lg w-full">
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
            <button
              type="button"
              onClick={toggleEditMode}
              className="bg-blue-400 text-white px-5 py-1 rounded-md hover:bg-blue-600 transition"
            >
              {isEditMode ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {/* Conditional rendering based on edit mode */}
          {isEditMode ? (
            <>
              {role >= 3 && (
                <>
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
                      defaultValue={new Date(selectedEvent.start).toLocaleDateString("en-CA") + "T" + new Date(selectedEvent.start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">End Time:</label>
                    <input
                      type="datetime-local"
                      name="end"
                      defaultValue={new Date(selectedEvent.end).toLocaleDateString("en-CA") + "T" + new Date(selectedEvent.end).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </>
              )}

              {role >= 2 && (
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

                  <label className="block mb-1 text-sm font-medium">Note:</label>
                  <textarea
                    name="notes"
                    defaultValue={selectedEvent.notes}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  <div>
                    <label className="block mb-1 text-sm font-medium">Upload Image:</label>
                    <input
                      type="file"
                      name="image"
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <p className="text-center font-bold">{selectedEvent.title}</p>
              </div>

              <div className="flex items-center gap-2">
                {selectedEvent.image ? (
                  <img
                    src={`http://localhost:5000/api/tasks/get-image/${selectedEvent._id}`}
                    alt={selectedEvent.title || 'Event Image'}
                    className="w-[1000px] h-[400px] object-cover"
                  />
                ) : (
                  <p>No image available</p>
                )}
              </div>

              {/* <div className="flex flex-col items-center justify-center gap-2">
                {assignedUsers.map((user, index) => (
                  <p key={index} className="text-center font-bold">
                    {user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : "Unknown User"}
                  </p>
                ))}
              </div> */}

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
            </div>
          )}

          <div className="flex justify-between mt-6">
            {isEditMode && (
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
              >
                Save Changes
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventDetailsModal;
