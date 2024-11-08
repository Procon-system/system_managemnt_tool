
import React, { useState, useEffect } from 'react';
import EventCalendarWrapper from '../Helper/EventCalendarWrapper';
import { useDispatch, useSelector } from 'react-redux';
import { createTask, updateTask, fetchTasks } from '../Store/taskSlice'; // Import your actions
import TaskPage from '../Pages/taskPage'
const HomePage = () => {
  const dispatch = useDispatch();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isCreateFormVisible, setIsCreateFormVisible] = useState(false);
  const [isEditFormVisible, setIsEditFormVisible] = useState(false);
  const { tasks, status, error } = useSelector(state => state.tasks);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchTasks());
    }
  }, [dispatch, status]);
 console.log("tasks",tasks)
  const calendarEvents = tasks.map(task => ({
    _id: task._id, // Keep the _id for database updates
    title: task.title || 'No Title',
    start: task.start_time,
    end: task.end_time,
    color: task.color_code,
  }));

  // Handle event creation
  const handleEventCreate = (newEvent) => {
    console.log('Event Created:', newEvent);
    dispatch(createTask(newEvent));
  };

  // Handle event update
  const handleEventUpdate = (updatedEvent) => {
    console.log('Event Updated:', updatedEvent);
    if (updatedEvent._id) {
      dispatch(updateTask({ taskId: updatedEvent._id, updatedData: updatedEvent }));
    } else {
      console.error("Update failed: Event ID is undefined.");
    }
  };

  const openForm = (event) => {
    setSelectedEvent(event);
    setIsEditFormVisible(true);
  };
// Open the "Create Task" form
const openCreateForm = () => {
  setIsCreateFormVisible(true);
  setSelectedEvent(null); // Clear the selected event for new task
};
  const closeModal = () => {
    setIsCreateFormVisible(false);
    setIsEditFormVisible(false);
    setSelectedEvent(null);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const updatedEvent = {
      ...selectedEvent,
      title: e.target.title.value,
      start_time: e.target.start.value,
      end_time: e.target.end.value,
    };

    handleEventUpdate(updatedEvent);  // Send updated event to backend
    closeModal();  // Close the modal after submission
  };

  // Check loading or error status
  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'failed') return <div>Error: {error}</div>;

  return (
    <div>
      <button
        onClick={openCreateForm} // Open form for creating a new task
        className="mb-4 bg-blue-500 text-white px-6 py-2 mt-5 ml-2 rounded-md"
      >
        + Task
      </button>
      <EventCalendarWrapper
        events={calendarEvents}
        onEventCreate={handleEventCreate}
        onEventUpdate={handleEventUpdate}
        openForm={openForm}
      />
      
      {isCreateFormVisible && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="relative bg-white p-5 rounded-lg max-w-5xl my-16 w-full z-60">
      {/* Close Button at the Top-Right Corner */}
      <button
  type="button"
  onClick={closeModal}
  className="absolute top-2 right-5 text-red-700 hover:text-red-900 text-2xl font-bold transition-transform duration-200 transform hover:scale-110"
  aria-label="Close"
>
  ✕
</button>


      {/* TaskPage Component */}
      <TaskPage
        event={null}  // Passing null since it's a new task
        onClose={closeModal}  // Close modal after task creation
      />

    </div>
  </div>
)}

      {setIsEditFormVisible && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="relative bg-white p-6 rounded-lg max-w-sm w-full z-60">
          <button
            type="button"
            onClick={closeModal}
            className="absolute top-2 right-2 text-red-700 hover:text-red-900 text-2xl font-bold transition-transform transform hover:scale-110"
            aria-label="Close"
          >
            &times;
          </button>
      
          <h2 className="text-xl font-semibold mb-4 text-center">Event Details</h2>
      
          <form onSubmit={handleFormSubmit} className="space-y-4">
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
                defaultValue={new Date(selectedEvent.start).toISOString().slice(0, -8)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
      
            <div>
              <label className="block mb-1 text-sm font-medium">End Time:</label>
              <input
                type="datetime-local"
                name="end"
                defaultValue={new Date(selectedEvent.end).toISOString().slice(0, -8)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
      
            <div className="flex justify-between mt-6">
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition">
                Save Changes
              </button>
              {/* <button
                type="button"
                onClick={closeModal}
                className="text-blue-500 underline hover:text-blue-700 transition"
              >
                Close
              </button> */}
            </div>
          </form>
        </div>
      </div>
      
      )}
    </div>
  );
};

export default HomePage;
