import React, { useState, useRef, useEffect ,useMemo,useCallback} from 'react';
import EventCalendarWrapper from '../Helper/EventCalendarWrapper';
import { io } from "socket.io-client";
import { useDispatch, useSelector } from 'react-redux';
import Sidebar from '../Components/sidebarComponent';
import { 
  createTask, 
  updateTask, 
  fetchTasks,
  getTasksByAssignedUser,
  getAllDoneTasks, 
  deleteTask,
  getTasksDoneByAssignedUser ,
  bulkUpdateTasks
} from '../features/taskSlice';
import { toast } from 'react-toastify';
import TaskPage from './Task/createTaskPage';
import EventDetailsModal from '../Components/taskComponents/updateTaskForm';
import getColorForStatus from '../Helper/getColorForStatus';
const API_URL='http://localhost:5000';
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
  const [showTaskPage, setShowTaskPage] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
 
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Add event listeners for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
//   const updateEventState = useCallback((updatedEvents = [], deletedEventId = null) => {
//     setFilteredEvents((prevEvents) => {
//       let currentEvents = prevEvents || tasks || [];
  
//       // Handle deletion
//       if (deletedEventId) {
//         handleTaskDeletion(deletedEventId);
//         const updatedEvents = currentEvents.filter(
//           (event) => event._id !== deletedEventId
//         );
//         eventsRef.current = updatedEvents; // Sync with ref
//         return updatedEvents; // Update state
//       }
  
//       // Handle updates or additions
//       if (updatedEvents && updatedEvents.length > 0) {
//         const eventMap = new Map(
//           currentEvents.map((event) => [event._id, event])
//         );
  
//         updatedEvents.forEach((event) => {
//           if (event && event._id) {
//             eventMap.set(event._id, {
//               ...eventMap.get(event._id),
//               ...event,
//             });
//           }
//         });
  
//         const finalEvents = Array.from(eventMap.values()).filter(
//           (event) =>
//             event._id &&
//             event.title &&
//             (event.start_time || event.start) &&
//             (event.end_time || event.end)
//         );
//         eventsRef.current = finalEvents; // Sync with ref
//         return finalEvents;
//       }
  
//       return currentEvents;
//     });
//   },[] // Dependency array
// );
   const handleTaskDeletion = useCallback((deletedTaskId) => {
    setDeletedTaskIds((prevIds) => new Set(prevIds).add(deletedTaskId));
  },[]);
  const updateEventState = useCallback((updatedEvents = [], deletedEventId = null) => {
    setFilteredEvents((prevEvents) => {
      let currentEvents = prevEvents || tasks || [];
  
      // Handle deletion
      if (deletedEventId) {
        handleTaskDeletion(deletedEventId);
        const updatedEvents = currentEvents.filter(
          (event) => event._id !== deletedEventId
        );
        eventsRef.current = updatedEvents; // Sync with ref
        return updatedEvents; // Update state
      }
  
      // Handle updates or additions
      if (updatedEvents && updatedEvents.length > 0) {
        const eventMap = new Map(
          currentEvents.map((event) => [event._id, event])
        );
  
        updatedEvents.forEach((event) => {
          if (event && event._id) {
            eventMap.set(event._id, {
              ...eventMap.get(event._id),
              ...event,
            });
          }
        });
  
        const finalEvents = Array.from(eventMap.values()).filter(
          (event) =>
            event._id &&
            event.title &&
            (event.start_time || event.start) &&
            (event.end_time || event.end)
        );
        eventsRef.current = finalEvents; // Sync with ref
        return finalEvents;
      }
  
      return currentEvents;
    });
  }, [tasks, handleTaskDeletion, eventsRef]); // Add dependencies
useEffect(() => {
  if (!isOnline) {
    console.log("Offline: WebSocket operations are paused.");
    // toast.warn("You are offline. Please check your internet connection.");
    return; // Skip WebSocket operations if offline
  }

  console.log("Online: Establishing WebSocket connection...");

  // Initialize WebSocket connection
  const socket = io(API_URL, {
    reconnection: true, // Enable reconnection
    reconnectionAttempts: 5, // Number of reconnection attempts
    reconnectionDelay: 1000, // Delay between reconnection attempts
  });

  // Event: Socket connected
  socket.on("connect", () => {
    console.log("Connected to WebSocket server:", socket.id);
  });

  // Event: Socket disconnected
  socket.on("disconnect", () => {
    console.log("Disconnected from WebSocket server.");
  });

  socket.on("tasksUpdated", ({ updatedTasks }) => {
    console.log("Tasks updated:", updatedTasks);
  
    if (!Array.isArray(updatedTasks)) return;
  
    // Batch update all events at once
    setFilteredEvents((prevEvents) => {
      const eventMap = new Map(prevEvents.map((event) => [event._id, event]));
  
      updatedTasks.forEach((task) => {
        const taskData = task.updatedTask || task;
  
        const formattedTask = {
          _id: taskData._id,
          title: taskData.title,
          start: taskData.start_time || taskData.start,
          end: taskData.end_time || taskData.end,
          color: taskData.color || taskData.color_code,
          status: taskData.status,
          notes: taskData.notes,
          assigned_resources: {
            assigned_to: taskData.assigned_to || [],
            tools: taskData.tools || [],
            materials: taskData.materials || [],
          },
        };
  
        if (eventMap.has(formattedTask._id)) {
          eventMap.set(formattedTask._id, {
            ...eventMap.get(formattedTask._id),
            ...formattedTask,
          });
        } else {
          eventMap.set(formattedTask._id, formattedTask);
        }
      });
  
      const updatedEvents = Array.from(eventMap.values());
      return updatedEvents.length > 0 ? updatedEvents : prevEvents;
    });
  });

  // Event: Task created
  socket.on("taskCreated", (broadcastData) => {
    console.log("Task created:", broadcastData);

    const newTasks = broadcastData?.newTasks
      ? broadcastData.newTasks
      : broadcastData?.newTask
      ? [broadcastData.newTask]
      : []; // Normalize to an array

    if (newTasks.length === 0) {
      console.error("Invalid task creation broadcast data:", broadcastData);
      return;
    }

    newTasks.forEach((newTask) => {
      if (newTask && newTask._id && !filteredEvents.some((event) => event._id === newTask._id)) {
        updateEventState(newTask);
      }
    });
  });

  // Event: Multiple tasks updated
  // socket.on("tasksUpdated", ({ updatedTasks }) => {
  //   console.log("Tasks updated:", updatedTasks);

  //   if (!Array.isArray(updatedTasks)) return;

  //   try {
  //     // Backup the current state before making any changes
  //     const currentEvents = [...filteredEvents];

  //     // Batch update all events at once
  //     setFilteredEvents((prevEvents) => {
  //       const eventMap = new Map(prevEvents.map((event) => [event._id, event]));

  //       updatedTasks.forEach((task) => {
  //         const taskData = task.updatedTask || task;

  //         const formattedTask = {
  //           _id: taskData._id,
  //           title: taskData.title,
  //           start: taskData.start_time || taskData.start,
  //           end: taskData.end_time || taskData.end,
  //           color: taskData.color || taskData.color_code,
  //           status: taskData.status,
  //           notes: taskData.notes,
  //           assigned_resources: {
  //             assigned_to: taskData.assigned_to || [],
  //             tools: taskData.tools || [],
  //             materials: taskData.materials || [],
  //           },
  //         };

  //         if (eventMap.has(formattedTask._id)) {
  //           eventMap.set(formattedTask._id, {
  //             ...eventMap.get(formattedTask._id),
  //             ...formattedTask,
  //           });
  //         } else {
  //           eventMap.set(formattedTask._id, formattedTask);
  //         }
  //       });

  //       const updatedEvents = Array.from(eventMap.values());
  //       return updatedEvents.length > 0 ? updatedEvents : prevEvents;
  //     });
  //   } catch (error) {
  //     console.error("Error processing task updates:", error);
  //     setFilteredEvents(filteredEvents); // Restore the previous state
  //     toast.error("Failed to update tasks. Please try again.");
  //   }
  // });
  socket.on("tasksUpdated", ({ updatedTasks }) => {
    console.log("Tasks updated:", updatedTasks);
  
    if (!Array.isArray(updatedTasks)) return;
    updateEventState(updatedTasks);
  });
  // Event: Task deleted
  socket.on("taskDeleted", (taskId) => {
    console.log("Task deleted:", taskId);

    if (!taskId) {
      console.error("Invalid task ID received for deletion.");
      return;
    }

    updateEventState(null, taskId); // Update state for deletion
  });

  // Clean up on unmount or when `isOnline` changes
  return () => {
    console.log("Cleaning up WebSocket connection...");
    socket.off("connect");
    socket.off("disconnect");
    socket.off("taskUpdated");
    socket.off("taskCreated");
    socket.off("tasksUpdated");
    socket.off("taskDeleted");
    socket.disconnect();
  };
}, [isOnline, updateEventState]); // Re-run effect when these dependencies change // Re-run effect when online status changes

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
          images: task.images || [],
          task_period:task.task_period,
          repeat_frequency:task.repeat_frequency,
          created_by:task.created_by,
          machine:task.machine || null,
          facility:task.facility || null,
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
    
    setFilteredEvents(calendarEvents);
    setIsInitialized(true);
  }
}, [calendarEvents, isInitialized]);

// First useEffect for fetching tasks
useEffect(() => {
  if (currentView === 'allTasks') {
   
    dispatch(fetchTasks()); // Fetch all tasks
  } else if (currentView === 'userTasks') {
    
       dispatch(getTasksByAssignedUser(user._id)); // Fetch tasks for the user
  } else if (currentView === 'userDoneTasks') {
   
    dispatch(getTasksDoneByAssignedUser(user._id)); // Fetch tasks done by the user
  } else if (currentView === 'allDoneTasks') {
    dispatch(getAllDoneTasks()); // Fetch all done tasks
  }
}, [currentView, dispatch, user?._id]);

useEffect(() => {
  if (calendarEvents.length > 0) {
    const validEvents = calendarEvents.filter(
      (event) => !deletedTaskIds.has(event._id)
    );
    if (currentView === 'allTasks') {
      setFilteredEvents(validEvents);
    } else if (currentView === 'userTasks') {
      setFilteredEvents(
        validEvents
        // filter((event) => {
        //   // Check if assigned_resources and assigned_to exist and are valid
        //   if (
        //     event.assigned_resources &&
        //     Array.isArray(event.assigned_resources.assigned_to) &&
        //     user?._id
        //   ) {
        //     // Extract the _id field from each object in assigned_to
        //     const assignedUserIds = event.assigned_resources.assigned_to.map(
        //       (user) => user._id
        //     )
        //     // Check if the user's ID is in the assignedUserIds array
        //     const isUserAssigned = assignedUserIds.includes(user._id);
            
        //     return isUserAssigned;
        //   }
        //   return false; // Exclude the event if conditions are not met
        // })
      );
    } else if (currentView === 'userDoneTasks') {
      setFilteredEvents(
        validEvents
        // .filter((event) => {
        //   // Check if assigned_resources and assigned_to exist and are valid
        //   if (
        //     event.assigned_resources &&
        //     Array.isArray(event.assigned_resources.assigned_to) &&
        //     user?._id
        //   ) {
        //     // Extract the _id field from each object in assigned_to
        //     const assignedUserIds = event.assigned_resources.assigned_to.map(
        //       (user) => user._id
        //     );

        //     return (
        //       event.status === 'done' &&
        //       assignedUserIds.includes(user._id)
        //     );
        //   }
        //   return false; // Exclude the event if conditions are not met
        // })
      );
    } else if (currentView === 'allDoneTasks') {
      setFilteredEvents(
        validEvents.filter((event) => event.status === 'done')
      );
    }
  }
}, [calendarEvents, currentView, deletedTaskIds, user?._id]);
const handleMultipleEventUpdate = (updatedEvents) => {
 
  if (!Array.isArray(updatedEvents) || updatedEvents.length === 0) {
    toast.error("No valid events to update.");
    return;
  }

  // Prepare the updated tasks data
  const updatedTasksData = updatedEvents.map((updatedEvent) => {
    if (updatedEvent.status) {
      updatedEvent.color = getColorForStatus(updatedEvent.status); // Update color based on status
    }
    return {
      _id: updatedEvent._id,
      start_time: updatedEvent.start_time || updatedEvent.start,
      end_time: updatedEvent.end_time || updatedEvent.end,
      color: updatedEvent.color,
      title: updatedEvent.title,
      updated_at: new Date().toISOString(),
    };
  });

  // Dispatch the bulk update action
  dispatch(bulkUpdateTasks(updatedTasksData))
    .unwrap()
    .then((successfulUpdates) => {
      console.log("Successful updates:", successfulUpdates);

      // Update the local state with the successful updates
      setFilteredEvents((prevEvents) => {
        const currentEvents = prevEvents || tasks || [];

        // Create a map of the current events for quick lookup
        const eventMap = new Map(currentEvents.map((event) => [event._id, event]));

        // Update the map with the successful updates
        successfulUpdates.forEach((updatedTask) => {
          if (updatedTask._id && updatedTask.title) {
            eventMap.set(updatedTask._id, {
              ...eventMap.get(updatedTask._id), // Preserve existing properties
              ...updatedTask, // Apply updates
            });
          }
        });

        // Convert the map back to an array of events
        const updatedFilteredEvents = Array.from(eventMap.values());

        // Sync with ref
        eventsRef.current = updatedFilteredEvents;

        // Return the updated events
        return updatedFilteredEvents;
      });

      toast.success("Tasks updated successfully!");
    })
    .catch((error) => {
      console.error("Error updating tasks:", error);
      toast.error("Failed to update tasks. Please try again.");
    });
};
const handleEventCreate = async (newEvent) => {
    try {
      const createdTask = await dispatch(createTask(newEvent));
  
      if (createdTask.error || !createdTask.payload) {
        throw new Error(createdTask.error || "Unknown error");
      }
      toast.success("Task created successfully!");
      return { success: true, data: createdTask.payload };
    } catch (err) {
      console.error("Task creation failed:", err);
      return { success: false, error: err.message || "Unknown error" };
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
  const formData = new FormData();
  formData.append("taskId", updatedEvent._id);

  // Keep images that are not removed
  formData.append("keptImages", JSON.stringify(updatedEvent.images));

  // Append new images
  if (updatedEvent.newImages && Array.isArray(updatedEvent.newImages)) {
    updatedEvent.newImages.forEach((image) => {
      if (image instanceof File) {
        formData.append("images", image);
      }
    });
  }

  // Append other fields
  for (const key in updatedEvent) {
    if (key !== "images" && key !== "newImages") {
      if (typeof updatedEvent[key] === "object" && updatedEvent[key] !== null) {
        formData.append(key, JSON.stringify(updatedEvent[key]));
      } else {
        formData.append(key, updatedEvent[key]);
      }
    }
  }

  dispatch(updateTask({ taskId: updatedEvent._id, updatedData: formData }))
    .then(() => {
      toast.success("Task updated successfully!");
    })
    .catch((err) => {
      toast.error("Failed to update task. Please try again.");
      console.error("Task update failed:", err);
    });
};

const handleDelete = async (id) => {
  try {
    // Dispatch delete action and wait for it to succeed
    await dispatch(deleteTask(id));
    setFilteredEvents((prevEvents) =>
      prevEvents.filter((event) => event._id !== id)
    );

    // Close the modal and show success toast
    closeModal();
    toast.success("Task deleted successfully!");
  } catch (error) {
    // Show error toast if deletion fails
    toast.error(`Failed to delete task: ${error.message}`);
  }
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
 
  const handleTaskButtonClick = () => {
    setShowTaskPage(true); // Show the TaskPage
  };
  return (
    <div className=' mt-7 lg:ml-72 mb-8'>
    
 <Sidebar
        onDateRangeSelect={handleDateRangeSelect}
        onCalendarDateChange={handleCalendarDateChange}
        handleEventCreate={handleEventCreate}
      />
      <EventCalendarWrapper
        events={calendarEvent }
        calendarStartDate={calendarStartDate} // Pass the updated start date
        calendarEndDate={calendarEndDate} // Pass the updated end date
        onEventCreate={handleEventCreate}
        onEventUpdate={handleEventUpdate}
        openForm={openEditForm}
        updateEventState={updateEventState}
        onMultipleEventUpdate={handleMultipleEventUpdate}
        openCreateForm={openCreateForm}
      />
       {/* TaskPage Modal - Always Rendered */}
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
        showTaskPage ? 'block' : 'hidden'
      }`}
    >
     <div className="relative bg-white p-4 sm:p-5 md:p-6 rounded-lg w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl max-h-[90vh] overflow-y-auto my-4 sm:my-6">
     <button
          type="button"
          onClick={() => setShowTaskPage(false)}
          className="absolute top-3 right-3 text-red-700 hover:text-red-900 text-xl sm:text-2xl font-bold transition-transform duration-200 transform hover:scale-110"
          aria-label="Close"
        >
          ✕
        </button>
  <TaskPage
    onEventCreate={handleEventCreate}
    onClose={() => setShowTaskPage(false)}
    isOffset={true}
  />
</div>
    </div>

    {/* Create Form Modal - Always Rendered */}
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
      isCreateFormVisible ? 'block' : 'hidden'
    }`}>
      <div className="relative bg-white p-4 sm:p-5 md:p-6 rounded-lg w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl max-h-[90vh] overflow-y-auto my-4 sm:my-6">
        <button
          type="button"
          onClick={closeModal}
          className="absolute top-3 right-3 text-red-700 hover:text-red-900 text-xl sm:text-2xl font-bold transition-transform duration-200 transform hover:scale-110"
          aria-label="Close"
        >
          ✕
        </button>
        <TaskPage
          onEventCreate={handleEventCreate}
          event={selectedEvent}
          onClose={closeModal}
          isOffset={true}
        />
      </div>
    </div>

    {/* Event Details Modal - Always Rendered */}
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
      isEditFormVisible ? 'block' : 'hidden'
    }`}>
      <EventDetailsModal
        isVisible={isEditFormVisible}
        closeModal={closeModal}
        selectedEvent={selectedEvent}
        role={user?.access_level}
        handleFormSubmit={handleFormSubmit}
        handleDelete={handleDelete}
      />
    </div>

    <button
  className="fixed right-8 bottom-8 bg-blue-500 text-white px-3 py-2 rounded-full shadow-lg hover:bg-blue-600 transition z-50 animate-enlarge hover:scale-110"
  onClick={handleTaskButtonClick}
>
  + Task
</button>
  </div>
  );
};

export default HomePage;
