import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchMachines, 
  createMachine, 
  updateMachine, 
  deleteMachine,
  addMachineFromSocket 
} from '../../features/machineSlice';
import MachineForm from '../../Components/machineComponents/machineForm';
import io from 'socket.io-client';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import SearchBar from '../../Components/common/SearchBar';
import Pagination from '../../Components/common/Pagination';
import useSearchAndPagination from '../../hooks/useSearchAndPagination';
import { toast } from 'react-toastify';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL

const CreateMachinePage = () => {
  const dispatch = useDispatch();
  const machines = useSelector((state) => state.machines.machines || []);
  const [showForm, setShowForm] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const socket = io(API_BASE_URL); // Replace with your server URL
 
  // Initialize search and pagination
  const {
    searchTerm,
    currentPage,
    currentItems: currentMachines,
    totalPages,
    handleSearchChange,
    handlePageChange,
    totalItems
  } = useSearchAndPagination(machines, 7, ['machine_name', 'machine_type']);

  useEffect(() => {
    dispatch(fetchMachines());

    socket.on('machineCreated', (data) => {
      dispatch(addMachineFromSocket(data));
      toast.success('New machine added');
    });

    socket.on('machineUpdated', ({ machineId, updatedData }) => {
      dispatch({
        type: 'machines/updateMachine/fulfilled',
        payload: { _id: machineId, ...updatedData }
      });
      toast.success('Machine updated');
    });

    socket.on('machineDeleted', (deletedMachineId) => {
      dispatch({ 
        type: 'machines/deleteMachine/fulfilled', 
        payload: { id: deletedMachineId } 
      });
      toast.success('Machine deleted');
    });

    return () => {
      socket.off('machineCreated');
      socket.off('machineUpdated');
      socket.off('machineDeleted');
    };
  }, [dispatch]);

  const handleAddClick = () => {
    setEditingMachine(null);
    setShowForm(true);
  };

  const handleEditClick = (machine) => {
    setEditingMachine(machine);
    setShowForm(true);
  };

  const handleDeleteClick = async (machineId) => {
    try {
      await dispatch(deleteMachine(machineId)).unwrap();
      socket.emit('deleteMachine', machineId);
    } catch (error) {
      toast.error(`Failed to delete machine: ${error.message}`);
    }
  };

  const handleFormSubmit = async (machineData) => {
    try {
      if (editingMachine) {
        const result = await dispatch(updateMachine({ 
          machineId: editingMachine._id, 
          updatedData: machineData 
        })).unwrap();
        
        if (result) {
          socket.emit('updateMachine', { 
            machineId: editingMachine._id, 
            updatedData: machineData 
          });
        }
      } else {
        const createdMachine = await dispatch(createMachine(machineData)).unwrap();
        socket.emit('createMachine', createdMachine);
      }
      setShowForm(false);
      setEditingMachine(null);
    } catch (error) {
      toast.error(`Failed to submit form: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto md:mx-2 lg:ml-72 p-4">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-2 md:space-y-0">
        <h2 className="text-xl sm:text-2xl border p-1 rounded-md bg-blue-100 font-bold">Machines</h2>
        
        <SearchBar 
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          placeholder="Search machines..."
        />

        <button
          onClick={handleAddClick}
          className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition flex items-center space-x-2"
        >
          <FaPlus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Add Machine</span>
        </button>
      </div>

      {/* Machine List */}
      <div className="space-y-4">
        {Array.isArray(currentMachines) && currentMachines.length > 0 ? (
          currentMachines.map((machine) => (
            machine && machine._id ? (
              <div
                key={machine._id}
                className="p-4 border rounded shadow flex flex-col md:flex-row justify-between items-start md:items-center"
              >
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold">{machine.machine_name}</h3>
                  <p className="text-gray-600">Type: {machine.machine_type}</p>
                </div>
                <div className="flex space-x-3 mt-2 md:mt-0"> 
                  <button 
                    onClick={() => handleEditClick(machine)} 
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <FaEdit className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(machine._id)} 
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrash className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : null
          ))
        ) : (
          <p className="text-gray-600">No machines available</p>
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

      {/* Machine Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
              onClick={() => {
                setShowForm(false);
                setEditingMachine(null);
              }}
            >
              ×
            </button>
            <MachineForm
              onSubmit={handleFormSubmit}
              machine={editingMachine}
              onClose={() => {
                setShowForm(false);
                setEditingMachine(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateMachinePage;
