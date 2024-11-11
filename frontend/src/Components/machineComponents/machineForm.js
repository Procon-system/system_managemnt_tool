// src/components/MachineForm.js

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFacilities } from '../../features/facilitySlice'; // Redux action to fetch facilities

const MachineForm = ({ onSubmit }) => {
  const dispatch = useDispatch();
  const facilities = useSelector((state) => state.facilities.facilities); 
  const [machineName, setMachineName] = useState('');
  const [machineType, setMachineType] = useState('');
  const [facility, setFacility] = useState('');
  const [message, setMessage] = useState('');

  // Fetch facilities from Redux store on component mount
  useEffect(() => {
    dispatch(fetchFacilities());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit({
        machine_name: machineName,
        machine_type: machineType,
        facility,
      });
      setMessage('Machine created successfully!');
      setMachineName('');
      setMachineType('');
      setFacility('');
    } catch (error) {
      setMessage('Error creating machine: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded shadow-md">
      <h2 className="text-xl font-bold mb-4">Add New Machine</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Machine Name</label>
          <input
            type="text"
            value={machineName}
            onChange={(e) => setMachineName(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Machine Type</label>
          <input
            type="text"
            value={machineType}
            onChange={(e) => setMachineType(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Facility</label>
          <select
            value={facility}
            onChange={(e) => setFacility(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">Select a facility</option>
            {facilities.map((fac) => (
              <option key={fac._id} value={fac._id}>
                {fac.facility_name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition">
          Submit
        </button>
      </form>
      {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
    </div>
  );
};

export default MachineForm;
