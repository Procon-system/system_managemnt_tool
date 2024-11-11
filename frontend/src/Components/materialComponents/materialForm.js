// src/components/MaterialForm.js

import React, { useState } from 'react';
// import { useDispatch } from 'react-redux';
// import { createMaterial } from '../../features/materialSlice'; // Redux action to create material

const MaterialForm = ({ onSubmit }) => {
//   const dispatch = useDispatch();
  const [materialName, setMaterialName] = useState('');
  const [amountAvailable, setAmountAvailable] = useState(0);
  const [materialDescription, setMaterialDescription] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit({
        material_name: materialName,
        amount_available: amountAvailable,
        material_description: materialDescription
      });
      setMessage('Material created successfully!');
      setMaterialName('');
      setAmountAvailable(0);
      setMaterialDescription('');
    } catch (error) {
      setMessage('Error creating material: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded shadow-md">
      <h2 className="text-xl font-bold mb-4">Add New Material</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Material Name</label>
          <input
            type="text"
            value={materialName}
            onChange={(e) => setMaterialName(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Amount Available</label>
          <input
            type="number"
            value={amountAvailable}
            onChange={(e) => setAmountAvailable(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Material Description</label>
          <textarea
            value={materialDescription}
            onChange={(e) => setMaterialDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition">
          Submit
        </button>
      </form>
      {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
    </div>
  );
};

export default MaterialForm;
