import React, { useState, useRef, useEffect ,useMemo} from 'react';
import EventCalendarWrapper from '../Helper/EventCalendarWrapper';

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
 
} from '../features/taskSlice';
import { toast } from 'react-toastify';
import TaskPage from './Task/createTaskPage';
import EventDetailsModal from '../Components/taskComponents/updateTaskForm';
import getColorForStatus from '../Helper/getColorForStatus';

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
        validEvents
        // .filter((event) =>
        //   event.assigned_resources.assigned_to.includes(user?._id)
        // )
      );
    } else if (currentView === 'userDoneTasks') {
      setFilteredEvents(
        validEvents
        // .filter(
        //   (event) =>
        //     event.status === 'done' &&
        //     event.assigned_resources.assigned_to.includes(user?._id)
        // )
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
  console.log("Updated event before:", updatedEvent);

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
      // socket.emit("updateTask", updatedEvent);
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
