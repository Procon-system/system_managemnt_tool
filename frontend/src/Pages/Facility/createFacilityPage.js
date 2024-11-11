// src/Pages/CreateFacilityPage.js

import React from 'react';
import FacilityForm from '../../Components/facilityComponents/facilityForm';
import { useDispatch} from 'react-redux';
import { createFacility} from '../../features/facilitySlice';
const CreateFacilityPage = () => {
    const dispatch = useDispatch();
    const handleFacilitySubmit = async (taskData) => {
        try {
          const resultAction = await dispatch(createFacility(taskData)).unwrap();
          if (resultAction) {
            // onClose(); // Close form on successful submission
          }
        } catch (error) {
          console.error("Failed to create task:", error);
        }
      };
    
  return (
    <div className="container mx-auto p-4">
           <FacilityForm onSubmit={handleFacilitySubmit} />
    </div>
  );
};

export default CreateFacilityPage;
