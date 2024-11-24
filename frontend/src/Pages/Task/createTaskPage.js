import React from 'react';
import { useDispatch,useSelector } from 'react-redux';
import { createTask } from '../../features/taskSlice';
import TaskForm from '../../Components/taskComponents/taskForm';
import { toast } from 'react-toastify';
const TaskPage = ({ onClose, event ,isOffset = false}) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.tasks);
console.log("event acc",event);
  const initialTaskData = {
    title: event?.title || "",
    start_time: event?.start_time || "",
    end_time: event?.end_time || "",
    color_code: event?.color_code || "",
  };
  const handleTaskSubmit = async (taskData) => {
    try {
      const resultAction = await dispatch(createTask(taskData)).unwrap();
      
      if (resultAction) {
        if (onClose) {
          onClose(); // Call onClose only if it exists
        }
        toast.success("Task created successfully!");
      }    
    } catch (error) {
      console.error("Failed to create task:", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  return (
    <div className={`mt-3 ${isOffset ? '' : 'lg:ml-96'}`}>
     {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      <TaskForm onSubmit={handleTaskSubmit} initialData={initialTaskData} />
    </div>
  );
};
export default TaskPage;