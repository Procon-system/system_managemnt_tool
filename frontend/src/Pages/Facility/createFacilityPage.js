
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFacilities, createFacility, deleteFacility, updateFacility } from '../../features/facilitySlice';
import FacilityForm from '../../Components/facilityComponents/facilityForm';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

const CreateFacilityPage = () => {
  const dispatch = useDispatch();
  const facilities = useSelector((state) => state.facilities.facilities || []);
  const [showForm, setShowForm] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);

  useEffect(() => {
    dispatch(fetchFacilities());
  }, [dispatch]);

  const handleAddClick = () => {
    setEditingFacility(null);
    setShowForm(true);
  };

  const handleEditClick = (facility) => {
    setEditingFacility(facility);
    setShowForm(true);
  };

  const handleDeleteClick = async (facilityId) => {
    await dispatch(deleteFacility(facilityId));
  };

  const handleFormSubmit = async (facilityData) => {
    try {
      if (editingFacility) {
        console.log("id",editingFacility)
        await dispatch(updateFacility({facilityId: editingFacility._id,updatedData: { ...facilityData } })).unwrap();
      } else {
        await dispatch(createFacility(facilityData)).unwrap();
      }
      setShowForm(false);
    } catch (error) {
      console.error("Failed to submit form:", error);
    }
  };

  return (
    <div className="container mx-auto p-4 md:mx-96 lg:ml-72">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-2 md:space-y-0">
        <h2 className="text-xl sm:text-2xl border  p-2 rounded-md bg-blue-100 font-bold">Facilities</h2>
        <button
          onClick={handleAddClick}
          className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition flex items-center space-x-2"
        >
          <FaPlus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Add Facility</span>
        </button>
      </div>

      <div className="space-y-4">
        {facilities.length > 0 ? (
          facilities.map((facility) => (
            <div
              key={facility.id}
              className="p-4 border rounded shadow flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0"
            >
              <div className="flex-grow">
                <h3 className="text-lg font-semibold">{facility.facility_name}</h3>
                <p className="text-gray-600">{facility.location}</p>
              </div>
              <div className="flex space-x-3">
                <button onClick={() => handleEditClick(facility)} className="text-blue-500 hover:text-blue-700">
                  <FaEdit className="w-5 h-5" />
                </button>
                <button onClick={() => handleDeleteClick(facility._id)} className="text-red-500 hover:text-red-700">
                  <FaTrash className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No facilities available</p>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowForm(false)}
            >
              &times;
            </button>
            <FacilityForm
              onSubmit={handleFormSubmit}
              facility={editingFacility}
              onClose={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateFacilityPage;
