// src/Pages/CreateToolPage.js

import React from 'react';
import ToolForm from '../../Components/toolsComponents/toolForm'; // Make sure the path matches
import { useDispatch } from 'react-redux';
import { createTool } from '../../features/toolsSlice'; // Redux action to create tool

const CreateToolPage = () => {
  const dispatch = useDispatch();

  const handleToolSubmit = async (toolData) => {
    try {
      const resultAction = await dispatch(createTool(toolData)).unwrap();
      if (resultAction) {
        // Optional: handle success (e.g., show success message or redirect)
      }
    } catch (error) {
      console.error('Failed to create tool:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <ToolForm onSubmit={handleToolSubmit} />
    </div>
  );
};

export default CreateToolPage;
