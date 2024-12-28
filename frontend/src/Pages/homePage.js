
import React, { useState, useRef, useEffect ,useMemo} from 'react';
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
  const eventsRef = useRef([]);
  const updateEventState = (updatedEvent = null, deletedEventId = null) => {
    if (deletedEventId) {
      // Handle deletion
      setFilteredEvents((prevEvents) => {
      
        const currentEvents = prevEvents && prevEvents.length > 0 ? prevEvents : (tasks || []);

                      if (currentEvents.length === 0) {
                console.warn("No events available to delete.");
                return currentEvents; // Return unchanged
              }
              const updatedEvents = currentEvents.filter(event => event._id !== deletedEventId);
              eventsRef.current = updatedEvents; // Sync with ref
              return updatedEvents;
          });
      return; // Exit early after deletion
    }
    if (!updatedEvent || !updatedEvent._id || !updatedEvent.title) {
      console.error('Invalid event structure:', updatedEvent);
      return; // Skip invalid events
    }
    setFilteredEvents((prevEvents) => {
      console.log("prevEvents",prevEvents);
      if (prevEvents.length === 0) {
        console.warn("prevEvents is empty. Ensure events are being initialized properly.");
        prevEvents=tasks;
      }
      // Create a map for efficient updates
      console.log("prevEvents",prevEvents);
      const eventMap = new Map(
        prevEvents.map((event) => [event._id, event])
      );
      console.log("eventMap", eventMap);
      // Update or add the event
      eventMap.set(updatedEvent._id, {
        ...eventMap.get(updatedEvent._id),
        ...updatedEvent,
      });
  
      // Convert map back to an array and validate
      const updatedEvents = Array.from(eventMap.values()).filter((event) => {
        const isValid =
          event._id &&
          event.title &&
          (event.start_time || event.start) &&
          (event.end_time || event.end);
  
        if (!isValid) {
          console.warn('Removing invalid event:', event);
        }
        return isValid;
      });
      // Sync the ref with the updated events
      eventsRef.current = updatedEvents;
  
      return updatedEvents; // Update state with valid events
    });
  };
 
  
  useEffect(() => {
    // Confirm socket connection
      socket.on("connect", () => {
        console.log("Connected to WebSocket server:", socket.id);
    });

  socket.on("taskUpdated", (updatedTask) => {
    updateEventState(updatedTask);
    });
    
   // Listen for task creations
   socket.on("taskCreated", (broadcastData) => {
    const newTask = broadcastData?.payload?.taskData;

  if (!newTask) {
    console.error("Invalid task creation broadcast data:", broadcastData);
    return; // Skip invalid broadcasts
  }
  if (!filteredEvents.some(event => event._id === newTask._id)) {
    updateEventState(newTask);
  }
  
  });
// Listen for task deletions
socket.on("taskDeleted", (taskId) => {
   updateEventState(null, taskId); // Update state for deletion

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
  if (filteredEvents.length === 0) {
    setFilteredEvents(calendarEvents || []);
  }
}, [filteredEvents,calendarEvents]);


  const handleEventCreate = (newEvent) => {
    dispatch(createTask(newEvent))
    .then((createdTask) => {
      console.log("Task successfully created on backend, emitting WebSocket event:", createdTask);
      
  
      // Emit the newly created task
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
const handleDelete = (id) => {
  console.log("Deleting task with ID:", id);
  console.log("Current filteredEvents before delete:", filteredEvents);

  try {
    // Optimistically update filteredEvents
    setFilteredEvents((prevEvents) =>
      prevEvents.filter((event) => event._id !== id)
    );

    // Dispatch delete action and emit WebSocket event
    dispatch(deleteTask(id)).then(() => {
      socket.emit("deleteTask", id);
    });

    closeModal();
    toast.success("Task deleted successfully!");
  } catch (error) {
    toast.error(`Failed to delete task: ${error.message}`);
  }

  console.log("Current filteredEvents after delete:", filteredEvents);
};


useEffect(() => {
  console.log("Filtered events initialized:", filteredEvents);
}, [filteredEvents]);

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
  const calendarEvent = useMemo(() => {
    return filteredEvents; 
  }, [filteredEvents]); 
  
  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'failed') return <div>Error: {error}</div>;
 
  return (
    <div className=' mt-7 lg:ml-72 mb-8'>
      <DateRangeFilter 
      onDateRangeSelect={handleDateRangeSelect}
      onCalendarDateChange={handleCalendarDateChange} 
     />

      <EventCalendarWrapper
        events={calendarEvent }
        calendarStartDate={calendarStartDate} // Pass the updated start date
        calendarEndDate={calendarEndDate} // Pass the updated end date
        onEventCreate={handleEventCreate}
        onEventUpdate={handleEventUpdate}
        openForm={openEditForm}
        updateEventState={updateEventState}
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
      <TaskPage onEventCreate={handleEventCreate} event={selectedEvent} onClose={closeModal} isOffset={true} />
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
