
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMaterials, createMaterial, deleteMaterial, updateMaterial } from '../../features/materialsSlice';
import MaterialForm from '../../Components/materialComponents/materialForm';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

const CreateMaterialPage = () => {
  const dispatch = useDispatch();
  const materials = useSelector((state) => state.materials.materials || []);
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  useEffect(() => {
    dispatch(fetchMaterials());
  }, [dispatch]);

  const handleAddClick = () => {
    setEditingMaterial(null);
    setShowForm(true);
  };

  const handleEditClick = (material) => {
    setEditingMaterial(material);
    setShowForm(true);
  };

  const handleDeleteClick = async (materialId) => {
    await dispatch(deleteMaterial(materialId));
  };

  const handleFormSubmit = async (materialData) => {
    try {
      if (editingMaterial) {
        await dispatch(updateMaterial({ materialId: editingMaterial._id, updatedData: { ...materialData } })).unwrap();
      } else {
        await dispatch(createMaterial(materialData)).unwrap();
      }
      setShowForm(false);
    } catch (error) {
      console.error('Failed to submit form:', error);
    }
  };

  return (
    <div className="container mx-auto p-4 md:mx-96 lg:ml-72">
      <div className="flex md:flex-row justify-between items-center mb-4 space-y-2 md:space-y-0">
        <h2 className="text-xl sm:text-2xl border p-1 rounded-md bg-blue-100 font-bold">Materials</h2>
        <button
          onClick={handleAddClick}
          className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition flex items-center space-x-2"
        >
          <FaPlus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Add Material</span>
        </button>
      </div>

      <div className="space-y-4">
        {materials.length > 0 ? (
          materials.map((material) => (
            <div
              key={material.id}
              className="p-4 border rounded shadow flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0"
            >
              <div className="flex-grow">
                <h3 className="text-lg font-semibold">{material.material_name}</h3>
                <p className="text-gray-600">Available: {material.amount_available}</p>
                <p className="text-gray-600">{material.material_description}</p>
              </div>
              <div className="flex space-x-3">
                <button onClick={() => handleEditClick(material)} className="text-blue-500 hover:text-blue-700">
                  <FaEdit className="w-5 h-5" />
                </button>
                <button onClick={() => handleDeleteClick(material._id)} className="text-red-500 hover:text-red-700">
                  <FaTrash className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No materials available</p>
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
            <MaterialForm
              onSubmit={handleFormSubmit}
              material={editingMaterial}
              onClose={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateMaterialPage;
