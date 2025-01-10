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
  getTasksDoneByAssignedUser ,
  addTaskFromSocket 
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [deletedTaskIds, setDeletedTaskIds] = useState(new Set());
   const updateEventState = (updatedEvent = null, deletedEventId = null) => {
    setFilteredEvents((prevEvents) => {
      let currentEvents = prevEvents || tasks || [];
      
      // Handle deletion
      if (deletedEventId) {
        console.log("Deleting task with ID:", deletedEventId);
        handleTaskDeletion(deletedEventId);
        const updatedEvents = currentEvents.filter(
          (event) => event._id !== deletedEventId
        );
        eventsRef.current = updatedEvents; // Sync with ref
        return updatedEvents; // Update state
      }
      
      // Handle update or addition
      if (updatedEvent && updatedEvent._id && updatedEvent.title) {
        const eventMap = new Map(
          currentEvents.map((event) => [event._id, event])
        );
        eventMap.set(updatedEvent._id, {
          ...eventMap.get(updatedEvent._id),
          ...updatedEvent,
        });
        const updatedEvents = Array.from(eventMap.values()).filter(
          (event) =>
            !deletedTaskIds.has(event._id) && // Exclude deleted tasks
            event._id &&
            event.title &&
            (event.start_time || event.start) &&
            (event.end_time || event.end)
        );
        eventsRef.current = updatedEvents; // Sync with ref
       
        return updatedEvents;
      }
      console.log("currentEvents",currentEvents)
      return currentEvents;
    });
  };
  
  const handleTaskDeletion = (deletedTaskId) => {
    setDeletedTaskIds((prevIds) => new Set(prevIds).add(deletedTaskId));
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
    const newTask = broadcastData;
     console.log("broadcastTask",broadcastData)
     dispatch(addTaskFromSocket(newTask));
  if (!newTask) {
    console.error("Invalid task creation broadcast data:", broadcastData);
    return; // Skip invalid broadcasts
  }
  if (!filteredEvents.some(event => event._id === newTask._id)) {
    console.log("newTask",newTask)
    updateEventState(newTask.newTask);
  }
  
  });
socket.on("taskDeleted", (taskId) => {
  console.log("Task deletion received:", taskId);

  if (!taskId) {
    console.error("Invalid task ID received for deletion.");
    return;
  }

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


const calendarEvents = useMemo(() => {
  return Array.isArray(tasks)
    ? tasks
        .filter((task) => !deletedTaskIds.has(task._id)) // Exclude deleted tasks
        .map((task) => ({
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
}, [tasks, deletedTaskIds]); // Recompute when tasks or deletedTaskIds change

useEffect(() => {
  if (!isInitialized && calendarEvents.length > 0) {
    console.log("Initializing filtered events...");
    setFilteredEvents(calendarEvents);
    setIsInitialized(true);
  }
}, [calendarEvents, isInitialized]);


// First useEffect for fetching tasks
useEffect(() => {
  if (currentView === 'allTasks') {
    console.log("Fetching all tasks...");
    dispatch(fetchTasks()); // Fetch all tasks
  } else if (currentView === 'userTasks') {
    console.log("Fetching tasks assigned to the user...");
    dispatch(getTasksByAssignedUser(user._id)); // Fetch tasks for the user
  } else if (currentView === 'userDoneTasks') {
    console.log("Fetching tasks done by the user...");
    dispatch(getTasksDoneByAssignedUser(user._id)); // Fetch tasks done by the user
  } else if (currentView === 'allDoneTasks') {
    console.log("Fetching all done tasks...");
    dispatch(getAllDoneTasks()); // Fetch all done tasks
  }
}, [currentView, dispatch]);

useEffect(() => {
  if (calendarEvents.length > 0) {
    const validEvents = calendarEvents.filter(
      (event) => !deletedTaskIds.has(event._id)
    );
    if (currentView === 'allTasks') {
      setFilteredEvents(validEvents);
    } else if (currentView === 'userTasks') {
      setFilteredEvents(
        validEvents.filter((event) =>
          event.assigned_resources.assigned_to.includes(user?._id)
        )
      );
    } else if (currentView === 'userDoneTasks') {
      setFilteredEvents(
        validEvents.filter(
          (event) =>
            event.status === 'done' &&
            event.assigned_resources.assigned_to.includes(user?._id)
        )
      );
    } else if (currentView === 'allDoneTasks') {
      setFilteredEvents(
        validEvents.filter((event) => event.status === 'done')
      );
    }
  }
}, [calendarEvents, currentView, deletedTaskIds, user?._id]);

  const handleEventCreate = async (newEvent) => {
    try {
    const resultAction = await dispatch(createTask(newEvent));
     if (createTask.fulfilled.match(resultAction)) {
     
      // socket.emit("createTask", resultAction);
      toast.success("Task created successfully!");
    } else if (createTask.rejected.match(resultAction)) {
      // Handle error
      const errorMessage =
        resultAction.payload || "Failed to create task. Please try again.";
      toast.error(errorMessage);
    }
  } catch (error) {
    // Handle unexpected errors
    toast.error("An unexpected error occurred. Please try again.");
  }
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
          toast.success("Task updated successfully!")
        })
        .catch((err) => {
          toast.error("Failed to update task. Please try again.")
          console.error("Task update failed:", err);
        });
        
    } else {
      toast.error("Update failed: Event ID is undefined.");
      console.error("Update failed: Event ID is undefined.");
    }
  };
const handleDelete = async (id) => {
  try {
    // Dispatch delete action and wait for it to succeed
    await dispatch(deleteTask(id));

    // Emit WebSocket event after successful deletion
    socket.emit("deleteTask", id);

    // Update filtered events only after successful deletion
    // setFilteredEvents((prevEvents) =>
    //   prevEvents.filter((event) => event._id !== id)
    // );

    // Close the modal and show success toast
    closeModal();
    toast.success("Task deleted successfully!");
  } catch (error) {
    // Show error toast if deletion fails
    toast.error(`Failed to delete task: ${error.message}`);
  }

  // Log current filteredEvents for debugging
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
