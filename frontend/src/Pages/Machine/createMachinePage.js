// src/Pages/CreateMachinePage.js

import React from 'react';
import CreateMachineForm from '../../Components/machineComponents/machineForm';
import { useDispatch } from 'react-redux';
import { createMachine } from '../../features/machineSlice';

const CreateMachinePage = () => {
  const dispatch = useDispatch();

  const handleMachineSubmit = async (machineData) => {
    try {
      const resultAction = await dispatch(createMachine(machineData)).unwrap();
      if (resultAction) {
        console.log("Machine created successfully:", resultAction);
      }
    } catch (error) {
      console.error("Failed to create machine:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <CreateMachineForm onSubmit={handleMachineSubmit} />
    </div>
  );
};

export default CreateMachinePage;
