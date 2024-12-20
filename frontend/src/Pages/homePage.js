
import React, { useState, useEffect ,useMemo} from 'react';
import EventCalendarWrapper from '../Helper/EventCalendarWrapper';
import { io } from "socket.io-client";
import { useDispatch, useSelector } from 'react-redux';
import { 
  createTask, 
  updateTask, 
  fetchTasks,
  getTasksByAssignedUser,
  getAllDoneTasks, 
  deleteTask,
  getTasksDoneByAssignedUser  
} from '../features/taskSlice';
import { toast } from 'react-toastify';
import TaskPage from './Task/createTaskPage';
import EventDetailsModal from '../Components/taskComponents/updateTaskForm';
import DateRangeFilter from '../Components/taskComponents/datePicker';
import getColorForStatus from '../Helper/getColorForStatus';
const socket = io("http://localhost:5000"); // Replace with your server URL

const HomePage = () => {
  const dispatch = useDispatch();
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isCreateFormVisible, setIsCreateFormVisible] = useState(false);
  const [isEditFormVisible, setIsEditFormVisible] = useState(false);
  const { tasks, status, error, currentView } = useSelector((state) => state.tasks);
  const [calendarStartDate, setCalendarStartDate] = useState(null); // This will control the calendar's displayed start date
  const [calendarEndDate, setCalendarEndDate] = useState(null); // This will control the calendar's displayed end date
  const { user } = useSelector((state) => state.auth);
  // Connect to WebSocket on mount and handle incoming updates
  useEffect(() => {
    // Confirm socket connection
      socket.on("connect", () => {
      console.log("WebSocket connected:", socket.id);
    });
  
    // Listen for updates
    socket.on("taskUpdated", (updatedTask) => {
        setFilteredEvents((prevEvents) => {
        const validEvents = prevEvents.filter(event => event._id);
        const eventExists = validEvents.some(event => event._id === updatedTask._id);
        console.log("updatedTask",updatedTask)
        if (eventExists) {
          return validEvents.map(event =>
            event._id === updatedTask._id ? { ...event, ...updatedTask } : event
          );
         
        } else {
          return [updatedTask, ...validEvents];
        }
      });
    });
    
   // Listen for task creations
  socket.on("taskCreated", (newTask) => {
    console.log("new",newTask);
    setFilteredEvents((prevEvents) => [newTask, ...prevEvents]);
  });
// Listen for task deletions
socket.on("taskDeleted", (taskId) => {
  setFilteredEvents((prevEvents) => prevEvents.filter(event => event._id !== taskId));
  console.log(`Task with ID ${taskId} deleted`);
});
  // Clean up on unmount
  return () => {
    socket.off("taskUpdated");
    socket.off("taskCreated");
    socket.off("taskDeleted");
    socket.disconnect();
  };
}, []);

   useEffect(() => {
    if (currentView === 'allTasks') {
      dispatch(fetchTasks());
    } else if (currentView === 'userTasks') {
      dispatch(getTasksByAssignedUser(user._id));
    } else if (currentView === 'userDoneTasks') {
      dispatch(getTasksDoneByAssignedUser(user._id));
    } else if (currentView === 'allDoneTasks') {
      dispatch(getAllDoneTasks());
    }
  }, [currentView, dispatch, user]);
const calendarEvents = useMemo(() => {
  return Array.isArray(tasks)
    ? tasks.map((task) => ({
        _id: task._id,
        title: task.title || 'No Title',
        start: task.start_time,
        end: task.end_time,
        color: task.color_code,
        image: task.image,
        notes: task.notes || 'No Notes',
        status: task.status || null,
        assigned_resources: {
          assigned_to: task.assigned_to || [],
          tools: task.tools || [],
          materials: task.materials || [],
        },
        resourceIds: [
          ...(task.assigned_to || []),
          ...(task.tools || []),
          ...(task.materials || []),
        ],
      }))
    : [];
}, [tasks]); // Recompute only when tasks changes

useEffect(() => {
   setFilteredEvents(calendarEvents || []); // Ensure it initializes with a valid array
}, [calendarEvents]);

useEffect(() => {
  console.log("Filtered events updated:", filteredEvents);
}, [filteredEvents]);

  // const handleEventCreate = (newEvent) => {
  //   dispatch(createTask(newEvent));
  // };
  const handleEventCreate = (newEvent) => {
    dispatch(createTask(newEvent))
      .then((createdTask) => {
        console.log("Task successfully created on backend, emitting WebSocket event...");
        // Emit the newly created task to the server
        socket.emit("createTask", createdTask);
      })
      .catch((err) => {
        console.error("Task creation failed:", err);
      });
  };
  
  const handleDateRangeSelect = (startDate, endDate) => {
    if (!startDate || !endDate) {
      // Reset to all events when no date range is selected
      setFilteredEvents(calendarEvents);
    } else {
      // Filter events within the selected range
      const filtered = calendarEvents.filter((event) => {
        const eventStart = new Date(event.start);
        return eventStart >= new Date(startDate) && eventStart <= new Date(endDate);
      });
      setFilteredEvents(filtered);
    }
  };
  const handleCalendarDateChange = (startDate, endDate) => {
    // Update the calendar's start and end date when a date range is selected
    setCalendarStartDate(startDate);
    setCalendarEndDate(endDate);
  };
  const handleEventUpdate = (updatedEvent) => {
    if (updatedEvent._id) {
      if (updatedEvent.status) {
        updatedEvent.color = getColorForStatus(updatedEvent.status); // Update color based on status
      }
  
      dispatch(updateTask({ taskId: updatedEvent._id, updatedData: updatedEvent }))
        .then(() => {
          console.log("Task successfully updated on backend, emitting WebSocket event...");
          // Emit the updated task to the server
          socket.emit("updateTask", updatedEvent);
        })
        .catch((err) => {
          console.error("Task update failed:", err);
        });
        
    } else {
      console.error("Update failed: Event ID is undefined.");
    }
  };
 // Handle task deletion
 const handleDelete = async (id) => {
  if (window.confirm('Are you sure you want to delete this task?')) {
    try {
      await dispatch(deleteTask(id)).unwrap();
      toast.success('Task deleted successfully!');
    } catch (error) {
      toast.error(`Failed to delete task: ${error.message}`);
    }
  }
};
  const openCreateForm = (event = null) => {
    setIsCreateFormVisible(true);
    setIsEditFormVisible(false);
    setSelectedEvent(event); 
  
  };

  const openEditForm = (event) => {
    setSelectedEvent(event);
    setIsCreateFormVisible(false);
    setIsEditFormVisible(true);

  };

  const closeModal = () => {
    setIsCreateFormVisible(false);
    setIsEditFormVisible(false);
    setSelectedEvent(null);
  };
  const handleFormSubmit = (updatedEvent) => {
    handleEventUpdate(updatedEvent);
    closeModal();
  };

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'failed') return <div>Error: {error}</div>;

  return (
    <div className=' mt-7 lg:ml-72 mb-8'>
      <DateRangeFilter 
      onDateRangeSelect={handleDateRangeSelect}
      onCalendarDateChange={handleCalendarDateChange} 
     />

      <EventCalendarWrapper
        // events={calendarEvents}
        events={filteredEvents}
        calendarStartDate={calendarStartDate} // Pass the updated start date
        calendarEndDate={calendarEndDate} // Pass the updated end date
        onEventCreate={handleEventCreate}
        onEventUpdate={handleEventUpdate}
        openForm={openEditForm}
        openCreateForm={openCreateForm}
      />
      {isCreateFormVisible && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6">
    <div
      className="relative bg-white p-4 sm:p-5 md:p-6 rounded-lg w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 
      max-h-[90vh] overflow-y-auto my-4 sm:my-6"
    >
      <button
        type="button"
        onClick={closeModal}
        className="absolute top-3 right-3 text-red-700 hover:text-red-900 text-xl sm:text-2xl font-bold transition-transform duration-200 transform hover:scale-110"
        aria-label="Close"
      >
        ✕
      </button>
      <TaskPage event={selectedEvent} onClose={closeModal} isOffset={true} />
    </div>
  </div>
)}



      {isEditFormVisible && selectedEvent && (
      <EventDetailsModal
      isVisible={isEditFormVisible}
      closeModal={closeModal}
      selectedEvent={selectedEvent}
      role={user.access_level} 
      handleFormSubmit={handleFormSubmit} // Pass handleFormSubmit to the modal
      handleDelete={handleDelete} 
    />
  )}
    </div>
  );
};

export default HomePage;
