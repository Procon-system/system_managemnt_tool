
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFacilities } from '../../features/facilitySlice';

const MachineForm = ({ onSubmit, machine, onClose }) => {
  const dispatch = useDispatch();
  const facilities = useSelector((state) => state.facilities.facilities || []);
  const [machineName, setMachineName] = useState(machine?.machine_name || '');
  const [machineType, setMachineType] = useState(machine?.machine_type || '');
  const [facility, setFacility] = useState(machine?.facility || '');
  const [message, setMessage] = useState('');

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
      setMessage(machine ? 'Machine updated successfully!' : 'Machine created successfully!');
      setMachineName('');
      setMachineType('');
      setFacility('');
      setTimeout(() => {
        setMessage('');
        onClose();
      }, 2000);
    } catch (error) {
      setMessage('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  // return (
  //   <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
  //     <div className="max-w-md mx-auto p-6 bg-white rounded shadow-md">
  //       <h2 className="text-lg font-bold mb-4">{machine ? 'Edit Machine' : 'Add New Machine'}</h2>
  //       <form onSubmit={handleSubmit} className="space-y-4">
  //         <div>
  //           <label className="block text-sm font-medium">Machine Name</label>
  //           <input
  //             type="text"
  //             value={machineName}
  //             onChange={(e) => setMachineName(e.target.value)}
  //             required
  //             className="w-full px-3 py-2 border rounded-md"
  //           />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium">Machine Type</label>
  //           <input
  //             type="text"
  //             value={machineType}
  //             onChange={(e) => setMachineType(e.target.value)}
  //             className="w-full px-3 py-2 border rounded-md"
  //           />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium">Facility</label>
  //           <select
  //             value={facility}
  //             onChange={(e) => setFacility(e.target.value)}
  //             required
  //             className="w-full px-3 py-2 border rounded-md"
  //           >
  //             <option value="">Select a facility</option>
  //             {facilities.map((fac) => (
  //               <option key={fac._id} value={fac._id}>
  //                 {fac.facility_name}
  //               </option>
  //             ))}
  //           </select>
  //         </div>
  //         <button
  //           type="submit"
  //           className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
  //         >
  //           Submit
  //         </button>
  //       </form>
  //       {message && <p className="mt-4 text-sm text-green-600 text-center">{message}</p>}
  //       <button
  //         onClick={onClose}
  //         className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
  //       >
  //         Close
  //       </button>
  //     </div>
  //   </div>
  // );
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <div className="relative max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-lg">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl focus:outline-none"
          aria-label="Close"
        >
          &times;
        </button>
  
        {/* Form Header */}
        <h2 className="text-lg font-bold mb-4 text-center">
          {machine ? "Edit Machine" : "Add New Machine"}
        </h2>
  
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Machine Name */}
          <div>
            <label htmlFor="machineName" className="block text-sm font-medium mb-1">
              Machine Name
            </label>
            <input
              id="machineName"
              type="text"
              value={machineName}
              onChange={(e) => setMachineName(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
  
          {/* Machine Type */}
          <div>
            <label htmlFor="machineType" className="block text-sm font-medium mb-1">
              Machine Type
            </label>
            <input
              id="machineType"
              type="text"
              value={machineType}
              onChange={(e) => setMachineType(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
  
          {/* Facility */}
          <div>
            <label htmlFor="facility" className="block text-sm font-medium mb-1">
              Facility
            </label>
            <select
              id="facility"
              value={facility}
              onChange={(e) => setFacility(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a facility</option>
              {facilities.map((fac) => (
                <option key={fac._id} value={fac._id}>
                  {fac.facility_name}
                </option>
              ))}
            </select>
          </div>
  
          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition focus:ring focus:ring-blue-300"
          >
            Submit
          </button>
        </form>
  
        {/* Success Message */}
        {message && (
          <p className="mt-4 text-sm text-green-600 text-center">{message}</p>
        )}
      </div>
    </div>
  );
  
};

export default MachineForm;
