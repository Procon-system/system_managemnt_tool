
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
  getTasksDoneByAssignedUser  
} from '../features/taskSlice';
import TaskPage from './Task/createTaskPage';
import EventDetailsModal from '../Components/taskComponents/updateTaskForm';
import DateRangeFilter from '../Components/taskComponents/datePicker';
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
    console.log("Establishing WebSocket connection...");
    socket.on("connect", () => {
      console.log("WebSocket connected:", socket.id);
    });
  
    // Listen for updates
    socket.on("taskUpdated", (updatedTask) => {
      console.log("Real-time task update received:", updatedTask);
    
      setFilteredEvents((prevEvents) => {
        console.log("prev events",prevEvents)
        // const updatedEvents = prevEvents.map((event) =>
        //   event._id === updatedTask._id ? { ...event, ...updatedTask } : event
        // );
        // console.log("updatedEvents",updatedEvents)
        // return [...updatedEvents]; // Ensure a new array reference is created
        const eventExists = prevEvents.some(event => event._id === updatedTask._id);
  
        if (eventExists) {
          // Update existing event
          return prevEvents.map((event) =>
            event._id === updatedTask._id ? { ...event, ...updatedTask } : event
          );
        } else {
          // Append new event
          return [...prevEvents, updatedTask];
        }
      });
      
    });
    
    // Clean up on unmount
    return () => {
      console.log("Disconnecting WebSocket...");
      socket.disconnect();
    };
  }, []);
  console.log("filteredEvents",filteredEvents)

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


// Update filtered events when calendarEvents changes
// useEffect(() => {
//   console.log("Initializing filteredEvents with calendarEvents:", calendarEvents);
//   setFilteredEvents(calendarEvents);
//   // setFilteredEvents(calendarEvents);
// }, [calendarEvents]);
useEffect(() => {
  console.log("Initializing filteredEvents with calendarEvents:", calendarEvents);
  setFilteredEvents(calendarEvents || []); // Ensure it initializes with a valid array
}, [calendarEvents]);

useEffect(() => {
  console.log("Filtered events updated:", filteredEvents);
}, [filteredEvents]);

  const handleEventCreate = (newEvent) => {
    dispatch(createTask(newEvent));
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
    />
  )}
    </div>
  );
};

export default HomePage;
