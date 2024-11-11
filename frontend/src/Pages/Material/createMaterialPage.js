// src/Pages/CreateMaterialPage.js

import React from 'react';
import MaterialForm from '../../Components/materialComponents/materialForm'; 
import { useDispatch } from 'react-redux';
import { createMaterial } from '../../features/materialsSlice'; // Redux action to create material

const CreateMaterialPage = () => {
  const dispatch = useDispatch();

  const handleMaterialSubmit = async (materialData) => {
    try {
      const resultAction = await dispatch(createMaterial(materialData)).unwrap();
      if (resultAction) {
        // Optional: handle success (e.g., show success message or redirect)
      }
    } catch (error) {
      console.error('Failed to create material:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <MaterialForm onSubmit={handleMaterialSubmit} />
    </div>
  );
};

export default CreateMaterialPage;
