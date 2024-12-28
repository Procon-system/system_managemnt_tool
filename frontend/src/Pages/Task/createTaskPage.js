import React from 'react';
import TaskForm from '../../Components/taskComponents/taskForm';
import { toast } from 'react-toastify';
const TaskPage = ({ onClose, onEventCreate,event ,isOffset = false}) => {
 
  // const { loading, error } = useSelector((state) => state.tasks);
  const initialTaskData = {
    title: event?.title || "",
    start_time: event?.start_time || "",
    end_time: event?.end_time || "",
    color_code: event?.color_code || "",
  };
  const handleTaskSubmit = async (taskData) => {
    try {
      if (onEventCreate) {
        await onEventCreate(taskData); // Ensure it's awaited if necessary
      }

      if (onClose) {
        onClose();
      }
      toast.success("Task created successfully!");
    } catch (error) {
      const errorMessage =
        error?.message || "An unknown error occurred while creating the task.";
      toast.error(`Error: ${errorMessage}`);
    }
  };

  return (
    <div className={`mt-3 ${isOffset ? '' : 'lg:ml-96'}`}>
      <TaskForm onSubmit={handleTaskSubmit} initialData={initialTaskData} />
    </div>
  );
};
export default TaskPage;