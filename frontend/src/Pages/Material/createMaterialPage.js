import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchMaterials, 
  createMaterial, 
  deleteMaterial, 
  updateMaterial, 
  addMaterialFromSocket 
} from '../../features/materialsSlice';
import MaterialForm from '../../Components/materialComponents/materialForm';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import SearchBar from '../../Components/common/SearchBar';
import Pagination from '../../Components/common/Pagination';
import useSearchAndPagination from '../../hooks/useSearchAndPagination';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL
console.log("API_BASE_URL",API_BASE_URL)
const CreateMaterialPage = () => {
  const dispatch = useDispatch();
  const materials = useSelector((state) => state.materials.materials || []);
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const socket = io(API_BASE_URL);
  // const socket = io("http://localhost:5000");
  // Initialize search and pagination
  const {
    searchTerm,
    currentPage,
    currentItems: currentMaterials,
    totalPages,
    handleSearchChange,
    handlePageChange,
    totalItems
  } = useSearchAndPagination(materials, 7, ['material_name', 'material_description']);

  useEffect(() => {
    dispatch(fetchMaterials());

    socket.on('materialCreated', (data) => {
      dispatch(addMaterialFromSocket(data));
      toast.success('New material added');
    });

    socket.on('materialUpdated', ({ materialId, updatedData }) => {
      const updatedMaterial = { _id: materialId, ...updatedData };
      dispatch({
        type: 'materials/updateMaterial/fulfilled',
        payload: updatedMaterial,
      });
      toast.success('Material updated');
    });

    socket.on('materialDeleted', (deletedMaterialId) => {
      dispatch({ 
        type: 'materials/deleteMaterial/fulfilled', 
        payload: { id: deletedMaterialId } 
      });
      toast.success('Material deleted');
    });

    return () => {
      socket.off('materialCreated');
      socket.off('materialUpdated');
      socket.off('materialDeleted');
      socket.disconnect();
    };
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
    try {
      await dispatch(deleteMaterial(materialId)).unwrap();
      socket.emit('deleteMaterial', materialId);
    } catch (error) {
      toast.error(`Failed to delete material: ${error.message}`);
    }
  };

  const handleFormSubmit = async (materialData) => {
    try {
      if (editingMaterial) {
        await dispatch(updateMaterial({ 
          materialId: editingMaterial._id, 
          updatedData: { ...materialData } 
        })).unwrap();
        socket.emit('updateMaterial', { 
          materialId: editingMaterial._id, 
          updatedData: materialData 
        });
      } else {
        const result = await dispatch(createMaterial(materialData)).unwrap();
        setShowForm(false);
      }
    } catch (error) {
      toast.error(`Failed to submit form: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto p-4 md:mx-2 lg:ml-72">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-2 md:space-y-0">
        <h2 className="text-xl sm:text-2xl border p-1 rounded-md bg-blue-100 font-bold">Materials</h2>
        
        <SearchBar 
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          placeholder="Search materials..."
        />

        <button
          onClick={handleAddClick}
          className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition flex items-center space-x-2"
        >
          <FaPlus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Add Material</span>
        </button>
      </div>

      {/* Materials List */}
      <div className="space-y-4">
        {Array.isArray(currentMaterials) && currentMaterials.length > 0 ? (
          currentMaterials.map((material) => (
            material && material._id ? (
              <div
                key={material._id}
                className="p-4 border rounded shadow flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0"
              >
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold">{material.material_name}</h3>
                  <p className="text-gray-600">Available: {material.amount_available}</p>
                  <p className="text-gray-600">{material.material_description}</p>
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => handleEditClick(material)} 
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <FaEdit className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(material._id)} 
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrash className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : null
          ))
        ) : (
          <p className="text-gray-600">No materials available</p>
        )}
      </div>

      {/* Pagination */}
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemsPerPage={7}
        totalItems={totalItems}
      />

      {/* Material Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
              onClick={() => {
                setShowForm(false);
                setEditingMaterial(null);
              }}
            >
              ×
            </button>
            <MaterialForm
              onSubmit={handleFormSubmit}
              material={editingMaterial}
              onClose={() => {
                setShowForm(false);
                setEditingMaterial(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateMaterialPage;

