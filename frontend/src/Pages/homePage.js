
import React, { useState, useEffect } from 'react';
import EventCalendarWrapper from '../Helper/EventCalendarWrapper';
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
const HomePage = () => {
  const dispatch = useDispatch();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isCreateFormVisible, setIsCreateFormVisible] = useState(false);
  const [isEditFormVisible, setIsEditFormVisible] = useState(false);
  const { tasks, status, error, currentView } = useSelector((state) => state.tasks);
  const { user } = useSelector((state) => state.auth);
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
  const calendarEvents = Array.isArray(tasks)
  ? tasks.map(task => ({
    
      _id: task._id,
      title: task.title || 'No Title',
      start: task.start_time,
      end: task.end_time,
      color: task.color_code,
      image: task.image,
      notes: task.notes ||'this',
      status:task.status || null,
      assigned_resources: {
        assigned_to: task.assigned_to || [],
        tools: task.tools || [],
        materials: task.materials || [],
      },
      resourceIds: [
        ...(task.assigned_to || []).map(userId => userId),
        ...(task.tools || []).map(toolId => toolId),
        ...(task.materials || []).map(materialId => materialId),
      ],
      
    
    }))
  : [];

  const handleEventCreate = (newEvent) => {
    dispatch(createTask(newEvent));
  };

  const handleEventUpdate = (updatedEvent) => {
    if (updatedEvent._id) {
      dispatch(updateTask({ taskId: updatedEvent._id, updatedData: updatedEvent }));
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
      <EventCalendarWrapper
        events={calendarEvents}
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
