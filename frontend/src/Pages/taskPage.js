import React from 'react';
import { useDispatch,useSelector } from 'react-redux';
import { createTask } from '../Store/taskSlice';
import TaskForm from '../Components/taskComponents/taskForm';


//   const dispatch = useDispatch();

//   const handleTaskSubmit = (taskData) => {
//     dispatch(createTask(taskData));
//     // onClose();  // Close modal after submit
//   };

//   return (
//     <div>
//       <h1 className="text-xl font-bold text-center mb-4">Create Task</h1>
//       <TaskForm onSubmit={handleTaskSubmit} initialData={event} />
//     </div>
//   );
// };
const TaskPage = ({ onClose }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.tasks);

  const handleTaskSubmit = async (taskData) => {
    const resultAction = await dispatch(createTask(taskData));
    if (createTask.fulfilled.match(resultAction)) {
      // Close the form if the task was created successfully
      onClose();
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-center mb-4">Create Task</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      <TaskForm onSubmit={handleTaskSubmit} />
    </div>
  );
};

export default TaskPage;