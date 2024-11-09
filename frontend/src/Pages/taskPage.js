import React from 'react';
import { useDispatch,useSelector } from 'react-redux';
import { createTask } from '../Store/taskSlice';
import TaskForm from '../Components/taskComponents/taskForm';

// const TaskPage = ({ onClose }) => {
//   const dispatch = useDispatch();
//   const { loading, error } = useSelector((state) => state.tasks);

//   const handleTaskSubmit = async (taskData) => {
//     const resultAction = await dispatch(createTask(taskData));
//     if (createTask.fulfilled.match(resultAction)) {
//       // Close the form if the task was created successfully
//       onClose();
//     }
//   };

//   return (
//     <div>
//       <h1 className="text-xl font-bold text-center mb-4">Create Task</h1>
//       {loading && <p>Loading...</p>}
//       {error && <p className="text-red-500">Error: {error}</p>}
//       <TaskForm onSubmit={handleTaskSubmit} />
//     </div>
//   );
// };

// export default TaskPage;
// openCreateForm modified to accept default values for event detail
// In TaskPage, initialize the form based on the passed "event" prop
const TaskPage = ({ onClose, event }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.tasks);
console.log("event acc",event);
  const initialTaskData = {
    title: event?.title || "",
    start_time: event?.start_time || "",
    end_time: event?.end_time || "",
    color_code: event?.color_code || "",
  };

  // const handleTaskSubmit = async (taskData) => {
  //   const resultAction = dispatch(createTask(taskData));
  //   if (createTask.fulfilled.match(resultAction)) {
  //     onClose(); // Close form on successful submission
  //   }
  // };
  const handleTaskSubmit = async (taskData) => {
    try {
      const resultAction = await dispatch(createTask(taskData)).unwrap();
      if (resultAction) {
        onClose(); // Close form on successful submission
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-center mb-4">Create Task</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      <TaskForm onSubmit={handleTaskSubmit} initialData={initialTaskData} />
    </div>
  );
};
export default TaskPage;