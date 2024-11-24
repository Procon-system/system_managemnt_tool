
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMachines, createMachine, updateMachine, deleteMachine } from '../../features/machineSlice';
import MachineForm from '../../Components/machineComponents/machineForm';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

const CreateMachinePage = () => {
  const dispatch = useDispatch();
  const machines = useSelector((state) => state.machines.machines || []);
  const [showForm, setShowForm] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);

  useEffect(() => {
    dispatch(fetchMachines());
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
    await dispatch(deleteMachine(machineId));
  };

  const handleFormSubmit = async (machineData) => {
    try {
      if (editingMachine) {
        await dispatch(updateMachine({ machineId: editingMachine._id, updatedData: machineData })).unwrap();
      } else {
        await dispatch(createMachine(machineData)).unwrap();
      }
      setShowForm(false);
    } catch (error) {
      console.error("Failed to submit form:", error);
    }
  };
  return (
    <div className="container mx-auto md:mx-96 lg:ml-72 p-4">
      {/* Header with Add Button */}
      <div className="flex md:flex-row justify-between items-center mb-4 space-y-2 md:space-y-0">
        <h2 className="text-xl p-1 rounded-md bg-blue-100 font-bold">Machines</h2>
        <button
          onClick={handleAddClick}
          className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 flex items-center space-x-2"
        >
          <FaPlus className="w-4 h-4" />
          <span>Add Machine</span>
        </button>
      </div>
  
      {/* Machine List */}
      <div className="space-y-4">
        {machines.length > 0 ? (
          machines.map((machine) => (
            <div
              key={machine._id}
              className="p-4 border rounded shadow flex flex-col md:flex-row justify-between items-start md:items-center"
            >
              <div className="flex-grow">
                <h3 className="text-lg font-semibold">{machine.machine_name}</h3>
                <p className="text-gray-600">Type: {machine.machine_type}</p>
              </div>
              <div className="flex space-x-3">
                <button onClick={() => handleEditClick(machine)} className="text-blue-500 hover:text-blue-700">
                  <FaEdit />
                </button>
                <button onClick={() => handleDeleteClick(machine._id)} className="text-red-500 hover:text-red-700">
                  <FaTrash />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No machines available</p>
        )}
      </div>
  
      {/* Machine Form for Adding/Editing */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
            {/* MachineForm Component */}
            <MachineForm
              onSubmit={handleFormSubmit}
              machine={editingMachine}
              onClose={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
  
//   return (
//     <div className="container mx-auto md:mx-96 lg:ml-72 p-4">
//       {/* Header with Add Button */}
//       <div className="flex md:flex-row justify-between items-center mb-4 space-y-2 md:space-y-0">
//         <h2 className="text-xl p-1 rounded-md bg-blue-100 font-bold">Machines</h2>
//         <button
//           onClick={handleAddClick}
//           className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 flex items-center space-x-2"
//         >
//           <FaPlus className="w-4 h-4" />
//           <span>Add Machine</span>
//         </button>
//       </div>

//       {/* Machine List */}
//       <div className="space-y-4">
//         {machines.length > 0 ? (
//           machines.map((machine) => (
//             <div
//               key={machine._id}
//               className="p-4 border rounded shadow flex flex-col md:flex-row justify-between items-start md:items-center"
//             >
//               <div className="flex-grow">
//                 <h3 className="text-lg font-semibold">{machine.machine_name}</h3>
//                 <p className="text-gray-600">Type: {machine.machine_type}</p>
//               </div>
//               <div className="flex space-x-3">
//                 <button onClick={() => handleEditClick(machine)} className="text-blue-500 hover:text-blue-700">
//                   <FaEdit />
//                 </button>
//                 <button onClick={() => handleDeleteClick(machine._id)} className="text-red-500 hover:text-red-700">
//                   <FaTrash />
//                 </button>
//               </div>
//             </div>
//           ))
//         ) : (
//           <p className="text-gray-600">No machines available</p>
//         )}
//       </div>

//       {/* Machine Form for Adding/Editing */}
//       {showForm && (
//   <div className="mt-6 flex justify-center">
//     <div className="bg-white p-6 rounded shadow-lg w-full max-w-md relative">
//       {/* Close Button */}
//       <button
//         className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-lg"
//         onClick={() => setShowForm(false)}
//       >
//         &times;
//       </button>

//       {/* MachineForm Component */}
//       <MachineForm
//         onSubmit={handleFormSubmit}
//         machine={editingMachine}
//         onClose={() => setShowForm(false)}
//       />
//     </div>
//   </div>
// )}

//     </div>
//   );
};

export default CreateMachinePage;
