import React, { useState, useRef, useEffect ,useMemo} from 'react';
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
  const [isUpdating, setIsUpdating] = useState(false);
  //  const updateEventState = (updatedEvent = null, deletedEventId = null) => {
   
  //   setFilteredEvents((prevEvents) => {
  //     let currentEvents = prevEvents || tasks || [];
      
  //     // Handle deletion
  //     if (deletedEventId) {
  //       handleTaskDeletion(deletedEventId);
  //       const updatedEvents = currentEvents.filter(
  //         (event) => event._id !== deletedEventId
  //       );
  //       eventsRef.current = updatedEvents; // Sync with ref
  //       return updatedEvents; // Update state
  //     }
  //     // Handle update or addition
  //     if (updatedEvent && updatedEvent._id && updatedEvent.title) {
  //       const eventMap = new Map(
  //         currentEvents.map((event) => [event._id, event])
  //       );
  //       eventMap.set(updatedEvent._id, {
  //         ...eventMap.get(updatedEvent._id),
  //         ...updatedEvent,
  //       });
  //       const updatedEvents = Array.from(eventMap.values()).filter(
  //         (event) =>
  //           !deletedTaskIds.has(event._id) && // Exclude deleted tasks
  //           event._id &&
  //           event.title &&
  //           (event.start_time || event.start) &&
  //           (event.end_time || event.end)
  //       );
  //       eventsRef.current = updatedEvents; // Sync with ref
  //       return updatedEvents;
  //     }
  //     return currentEvents;
  //   });
  // };
  const updateEventState = (updatedEvents = [], deletedEventId = null) => {
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

  socket.on("taskCreated", (broadcastData) => {
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
      if (
        newTask &&
        newTask._id &&
        !filteredEvents.some((event) => event._id === newTask._id)
      ) {
        updateEventState(newTask);
      }
    });
  });
  
  // Add the bulk update socket handler
  socket.on("tasksUpdated", ({ updatedTasks }) => {
    if (!Array.isArray(updatedTasks)) return;
  
    try {
      // Backup the current state before making any changes
      const currentEvents = [...filteredEvents];  // Define currentEvents here
  
      // Batch update all events at once
      setFilteredEvents(prevEvents => {
        const eventMap = new Map(prevEvents.map(event => [event._id, event]));
  
        updatedTasks.forEach(task => {
          const taskData = task.updatedTask || task;
  
          // Properly format the task data
          const formattedTask = {
            _id: taskData._id,  // Ensure _id is used for uniqueness
            title: taskData.title,
            start: taskData.start_time || taskData.start,
            end: taskData.end_time || taskData.end,
            color: taskData.color || taskData.color_code, // Fallback to color_code if color is not present
            status: taskData.status,
            notes: taskData.notes,
            assigned_resources: {
              assigned_to: taskData.assigned_to || [],
              tools: taskData.tools || [],
              materials: taskData.materials || [],
            },
          };
  
          // Check if the task already exists in the map, then update or add it
          if (eventMap.has(formattedTask._id)) {
            eventMap.set(formattedTask._id, {
              ...eventMap.get(formattedTask._id),
              ...formattedTask,  // Merge the old and new task properties
            });
          } else {
            eventMap.set(formattedTask._id, formattedTask); // Add new task if not found
          }
        });
  
        // Convert the map back to an array and return
        const updatedEvents = Array.from(eventMap.values());
  
        // Ensure valid events before updating the state
        return updatedEvents.length > 0 ? updatedEvents : prevEvents; // Return prevEvents if updatedEvents is empty
      });
  
    } catch (error) {
      console.error("Error processing task updates:", error);
  
      // If an error occurs, restore the previous state
      setFilteredEvents(filteredEvents); // Restore the filteredEvents state
  
      toast.error("Failed to update tasks. Please try again.");
    }
  });
  
  
socket.on("taskDeleted", (taskId) => {

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
    socket.off("tasksUpdated");
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

const handleMultipleEventUpdate = (updatedEvents) => {
  if (!Array.isArray(updatedEvents) || updatedEvents.length === 0) {
    toast.error("No valid events to update.");
    return;
  }

  // Store current state as backup
  const backupEvents = [...filteredEvents];

  // Process each updated event
  updatedEvents.forEach((updatedEvent) => {
    if (updatedEvent._id) {
      if (updatedEvent.status) {
        updatedEvent.color = getColorForStatus(updatedEvent.status); // Update color based on status
      }

      // Dispatch the update for each event
      dispatch(updateTask({ taskId: updatedEvent._id, updatedData: updatedEvent }))
        .catch((err) => {
          toast.error("Failed to update task. Please try again.");
          console.error("Task update failed:", err);
        });
    }
  });

  // Emit all updated tasks at once to the server using the socket instance
  if (socket) {
    socket.emit("updateMultipleTasks", updatedEvents);
   
  } else {
    console.error("Socket instance is not available.");
    toast.error("Unable to emit updates. Socket connection not found.");
  }

  // Once all updates are dispatched, update the local state with the new tasks
  setFilteredEvents((prevEvents) => {
    let currentEvents = prevEvents || tasks || [];

    // Create a map of the current events by task ID
    const eventMap = new Map(currentEvents.map((event) => [event._id, event]));

    // Iterate over the updated events and update them in the event map
    updatedEvents.forEach((updatedEvent) => {
      if (updatedEvent._id && updatedEvent.title) {
        eventMap.set(updatedEvent._id, {
          ...eventMap.get(updatedEvent._id),
          ...updatedEvent,
        });
      }
    });

    // Filter out any deleted tasks (if you have a deletedTaskIds set)
    const updatedFilteredEvents = Array.from(eventMap.values()).filter(
      (event) =>
        !deletedTaskIds.has(event._id) && // Exclude deleted tasks
        event._id && event.title && (event.start_time || event.start) && (event.end_time || event.end)
    );

    eventsRef.current = updatedFilteredEvents; // Sync with ref
   
    return updatedFilteredEvents; // Update state with the new filtered events
  });

  toast.success("Tasks updated successfully!");
};



  // const handleEventCreate = (newEvent) => {
  //   dispatch(createTask(newEvent))
  //     .then((createdTask) => {
  //       socket.emit("createTask", createdTask);
  //       toast.success("Task updated successfully!");
  //     })
  //     .catch((err) => {
  //       console.error("Task creation failed:", err);
  //     });
  // };
  // const handleEventCreate = (newEvent) => {
  //   dispatch(createTask(newEvent))
  //     .then((createdTask) => {
  //       if (Array.isArray(createdTask.payload)) {
  //         // Multiple tasks were created (recurring events)
  //         socket.emit("createTask", { newTasks: createdTask.payload });
  //       } else {
  //         // Single task was created
  //         socket.emit("createTask", { newTasks: [createdTask.payload] });
  //       }
  //       toast.success("Task created successfully!");
  //       return { success: true, data: createdTask }; 
  //     })
  //     .catch((err) => {
  //       console.error("Task creation failed:", err);
  //       return { success: false, error: err.message || "Unknown error" };
  //     });
  // };
  const handleEventCreate = async (newEvent) => {
    try {
      const createdTask = await dispatch(createTask(newEvent));
  
      if (createdTask.error || !createdTask.payload) {
        throw new Error(createdTask.error || "Unknown error");
      }
  
      if (Array.isArray(createdTask.payload)) {
        socket.emit("createTask", { newTasks: createdTask.payload });
      } else {
        socket.emit("createTask", { newTasks: [createdTask.payload] });
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
  // const handleEventUpdate = (updatedEvent) => {
  //   console.log("upadted evevnt",updatedEvent)
  //   if (updatedEvent._id) {
  //     if (updatedEvent.status) {
  //       updatedEvent.color = getColorForStatus(updatedEvent.status); // Update color based on status
  //     }
  
  //     dispatch(updateTask({ taskId: updatedEvent._id, updatedData: updatedEvent }))
  //       .then(() => {
  //         // Emit the updated task to the server
  //         socket.emit("updateTask", updatedEvent);
  //         toast.success("Task updated successfully!")
  //       })
  //       .catch((err) => {
  //         toast.error("Failed to update task. Please try again.")
  //         console.error("Task update failed:", err);
  //       });
        
  //   } else {
  //     toast.error("Update failed: Event ID is undefined.");
  //     console.error("Update failed: Event ID is undefined.");
  //   }
  // };
  const handleEventUpdate = (updatedEvent) => {
    console.log("Updated event before:", updatedEvent);
    console.log("Images before appending:", updatedEvent.images);

    updatedEvent.images.forEach((image) => {
        console.log("Image type:", image instanceof File ? "File" : typeof image);
    });

    if (updatedEvent._id) {
        if (updatedEvent.status) {
            updatedEvent.color = getColorForStatus(updatedEvent.status);
        }

        const formData = new FormData();
        formData.append("taskId", updatedEvent._id);

        // Ensure images are appended correctly
        if (updatedEvent.images && Array.isArray(updatedEvent.images)) {
            updatedEvent.images.forEach((image, index) => {
                if (image instanceof File) {  // Ensure it's a File object
                    formData.append(`images`, image);  // No need for index notation
                } else {
                    console.warn("Skipping non-File image:", image);
                }
            });
        }

        // Append other fields
        for (const key in updatedEvent) {
            if (key !== "images") {
                if (typeof updatedEvent[key] === "object" && updatedEvent[key] !== null) {
                    formData.append(key, JSON.stringify(updatedEvent[key]));
                } else {
                    formData.append(key, updatedEvent[key]);
                }
            }
        }

        // Debugging FormData
        console.log("FormData content:");
        for (let pair of formData.entries()) {
            console.log(pair[0], pair[1]);
        }

        dispatch(updateTask({ taskId: updatedEvent._id, updatedData: formData }))
            .then(() => {
                socket.emit("updateTask", updatedEvent);
                toast.success("Task updated successfully!");
            })
            .catch((err) => {
                toast.error("Failed to update task. Please try again.");
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
 console.log("calendarEvent",calendarEvent)
  return (
    <div className=' mt-7 lg:ml-72 mb-8'>
      {/* <DateRangeFilter 
      onDateRangeSelect={handleDateRangeSelect}
      onCalendarDateChange={handleCalendarDateChange} 
     /> */}
 <Sidebar
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
        onMultipleEventUpdate={handleMultipleEventUpdate}
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
      role={user?.access_level} 
      handleFormSubmit={handleFormSubmit} // Pass handleFormSubmit to the modal
      handleDelete={handleDelete} 
    />
  )}
    </div>
  );
};

export default HomePage;
