
import React from 'react';
import { useDispatch } from 'react-redux';
import { createTask } from '../Store/taskSlice';
import TaskForm from '../Components/taskComponents/taskForm';

const TaskPage = () => {
  const dispatch = useDispatch();

  const handleTaskSubmit = (taskData) => {
    dispatch(createTask(taskData));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-5xl">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">Create New Task</h1>
        <TaskForm onSubmit={handleTaskSubmit} />
      </div>
    </div>
  );
};

export default TaskPage;
