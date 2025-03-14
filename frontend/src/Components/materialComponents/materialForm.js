
import React, { useState, useEffect } from 'react';

const MaterialForm = ({ onSubmit, material, onClose }) => {
  const [materialName, setMaterialName] = useState(material ? material.material_name : '');
  const [amountAvailable, setAmountAvailable] = useState(material ? material.amount_available : 0);
  const [materialDescription, setMaterialDescription] = useState(material ? material.material_description : '');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (material) {
      setMaterialName(material.material_name);
      setAmountAvailable(material.amount_available);
      setMaterialDescription(material.material_description);
    }
  }, [material]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit({
        material_name: materialName,
        amount_available: amountAvailable,
        material_description: materialDescription
      });
      setMessage('Material saved successfully!');
      setMaterialName('');
      setAmountAvailable(0);
      setMaterialDescription('');
      onClose();
    } catch (error) {
      setMessage('Error saving material: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div>
      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 text-center">
        {material ? 'Edit Material' : 'Add New Material'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm sm:text-base lg:text-lg font-medium">Material Name</label>
          <input
            type="text"
            value={materialName}
            onChange={(e) => setMaterialName(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md text-sm sm:text-base lg:text-lg"
          />
        </div>
        <div>
          <label className="block text-sm sm:text-base lg:text-lg font-medium">Amount Available</label>
          <input
            type="number"
            value={amountAvailable}
            onChange={(e) => setAmountAvailable(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md text-sm sm:text-base lg:text-lg"
          />
        </div>
        <div>
          <label className="block text-sm sm:text-base lg:text-lg font-medium">Material Description</label>
          <textarea
            value={materialDescription}
            onChange={(e) => setMaterialDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm sm:text-base lg:text-lg"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition text-sm sm:text-base lg:text-lg"
        >
          {material ? 'Update' : 'Submit'}
        </button>
      </form>
      {message && <p className="mt-4 text-sm sm:text-base lg:text-lg text-green-600 text-center">{message}</p>}
    </div>
  );
};

export default MaterialForm;
