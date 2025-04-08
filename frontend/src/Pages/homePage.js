import React, { useState, useRef, useEffect ,useMemo,useCallback} from 'react';
import EventCalendarWrapper from '../Helper/EventCalendarWrapper';
import { io } from "socket.io-client";
import { useDispatch, useSelector } from 'react-redux';
import Sidebar from '../Components/sidebarComponent';
import { 
  createTask, 
  updateTask, 
  fetchOrganizationTasks,
  getTasksByAssignedUser,
  getAllDoneTasks, 
  deleteTask,
  addMultipleTasksFromSocket,
  getTasksDoneByAssignedUser ,
  bulkUpdateTasks
} from '../features/taskSlice';
import { toast } from 'react-toastify';
import TaskPage from './Task/createTaskPage';
import EventDetailsModal from '../Components/taskComponents/updateTaskForm';
import getColorForStatus from '../Helper/getColorForStatus';
const API_URL=process.env.REACT_APP_API_BASE_URL;
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
  },[]);

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

  const handleTaskCreated = useCallback((broadcastData) => {
    console.log('Socket task received:', broadcastData);
    
    const tasks = broadcastData.newTasks || [broadcastData.newTask].filter(Boolean);
    
    // Dispatch all tasks at once for better performance
    if (tasks.length > 0) {
      dispatch(addMultipleTasksFromSocket(tasks));
    }
  }, [dispatch]);
  
useEffect(() => {
  const organizationId = user?.organization?._id || user?.organization; // Handle both object and string cases

  if (!isOnline) {
    console.log("[Socket] Offline - skipping WebSocket setup");
    return;
  }

  if (!organizationId) {
    console.error("[Socket] No organization ID found - cannot establish connection");
    return;
  }

  console.log("[Socket] Online - establishing connection for org:", organizationId);

  const socket = io(API_URL, {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    query: {
      organizationId: organizationId,
      userId: user?._id // Optional: include user ID for debugging
    }
  });

  // Connection events
  socket.on("connect", () => {
    console.log("[Socket] Connected with ID:", socket.id);
    
    // Join organization room upon connection
    socket.emit("joinRoom", organizationId, (response) => {
      if (response?.status === 'success') {
        console.log(`[Socket] Successfully joined room: ${organizationId}`);
      } else {
        console.error("[Socket] Failed to join room:", response?.error);
      }
    });
  });

  socket.on("disconnect", (reason) => {
    console.log("[Socket] Disconnected:", reason);
    if (reason === "io server disconnect") {
      // Attempt to reconnect if server disconnected us
      socket.connect();
    }
  });

  socket.on("connect_error", (err) => {
    console.error("[Socket] Connection error:", err.message);
    // Attempt to reconnect after delay
    setTimeout(() => socket.connect(), 5000);
  });


  socket.on("taskCreated", handleTaskCreated);



  return () => {
    console.log("[Socket] Cleaning up connection for org:", organizationId);
    
    // Leave room before disconnecting
    if (socket.connected) {
      socket.emit("leaveRoom", organizationId, (response) => {
        console.log(`[Socket] Leave room response:`, response);
      });
    }
    
    // Cleanup listeners
    socket.off("connect");
    socket.off("disconnect");
    socket.off("connect_error");
    socket.off("taskCreated", handleTaskCreated); // Important: use named function
   
    // Disconnect if still connected
    if (socket.connected) {
      socket.disconnect();
    }
  };
}, [isOnline, updateEventState, filteredEvents, user?.organization]); // Add user.organization t

useEffect(() => {
  // Always treat tasks as array
  const tasksArray = Array.isArray(tasks) ? tasks : [];
  
  // Transform tasks to calendar events
  const newEvents = tasksArray
    .map(task => ({
      ...task,
      id: task._id, // Ensure fullCalendar gets proper ID
      start: task.schedule?.start || task.start_time,
      end: task.schedule?.end || task.end_time,
      title: task.title || 'Untitled Task'
    }))
    .filter(event => event.start && event.end);
  
  // Only update if events actually changed
  setFilteredEvents(prev => {
    const prevIds = new Set(prev.map(e => e.id));
    const newIds = new Set(newEvents.map(e => e.id));
    
    // If same events, return previous array (maintain reference equality)
    if (prev.length === newEvents.length && 
        newEvents.every(e => prevIds.has(e.id)) &&
        prev.every(e => newIds.has(e.id))) {
      return prev;
    }
    return newEvents;
  });
}, [tasks]);
const calendarEvents = useMemo(() => {
  return Array.isArray(tasks?.data?.tasks)
    ? tasks.data.tasks
        .filter((task) => !deletedTaskIds.has(task._id))
        .map((task) => {
          // Format assigned resources with full details
          const assignedResources = {
            assigned_to: task.assignments?.map(assignment => ({
              _id: assignment._id,
              user: assignment.user ? {
                id: assignment.user._id,
                name: assignment.user.full_name || 
                      `${assignment.user.first_name} ${assignment.user.last_name}`,
                email: assignment.user.email
              } : null,
              team: assignment.team,
              role: assignment.role
            })) || [],
            resources: task.resources?.map(resource => ({
              _id: resource._id,
              relationshipType: resource.relationshipType,
              required: resource.required,
              resource: resource.resource ? {
                _id: resource.resource._id,
                type: resource.resource.type,
                displayName: resource.resource.displayName,
                fields: resource.resource.fields,
                status: resource.resource.status
              } : null
            })) || []
          };

          return {
            _id: task._id,
            title: task.title || 'No Title',
            start: task.schedule?.start,
            end: task.schedule?.end,
            timezone: task.schedule?.timezone || 'UTC',
            color: task.color_code || '#fbbf24',
            images: task.attachments || [],
            task_period: task.task_period,
            repeat_frequency: task.repeat_frequency,
            created_by: task.createdBy ? {
              id: task.createdBy._id,
              name: task.createdBy.full_name || 
                    `${task.createdBy.first_name} ${task.createdBy.last_name}`,
              email: task.createdBy.email
            } : null,
            priority: task.priority,
            visibility: task.visibility,
            status: task.status,
            organization: task.organization,
            assigned_resources: assignedResources, // Only keep this one
            resourceIds: [
                          ...(task.assignments?.map(a => a.user?._id).filter(Boolean) || []),
                          ...(task.resources?.map(r => r.resource?._id).filter(Boolean) || [])
                        ],
            dependencies: task.dependencies || [],
            tags: task.tags || [],
            notes: '',
            createdAt: task.createdAt,
            updatedAt: task.updatedAt
          };
        })
    : [];
}, [tasks, deletedTaskIds]);
useEffect(() => {
  if (!isInitialized && calendarEvents.length > 0) {
    
    setFilteredEvents(calendarEvents);
    setIsInitialized(true);
  }
}, [calendarEvents, isInitialized]);

// First useEffect for fetching tasks
useEffect(() => {
  if (currentView === 'allTasks') {
   
    dispatch(fetchOrganizationTasks({page :1, limit :100})); // Fetch all tasks
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
        
      );
    } else if (currentView === 'userDoneTasks') {
      setFilteredEvents(
        validEvents
        
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
    const result = await dispatch(createTask(newEvent));
    
    if (createTask.fulfilled.match(result)) {
      toast.success("Task created successfully!");
      // No need to manually update state - Redux and socket will handle it
      return { success: true };
    } else {
      throw new Error(result.error.message || "Failed to create task");
    }
  } catch (err) {
    toast.error(err.message);
    return { success: false };
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
