import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import io from 'socket.io-client';
import { 
  fetchFacilities, 
  createFacility, 
  deleteFacility, 
  updateFacility,
  facilityCreated,
  facilityUpdated,
  facilityDeleted 
} from '../../features/facilitySlice';
import { toast } from 'react-toastify';
import FacilityForm from '../../Components/facilityComponents/facilityForm';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import SearchBar from '../../Components/common/SearchBar';
import Pagination from '../../Components/common/Pagination';
import useSearchAndPagination from '../../hooks/useSearchAndPagination';

// const CreateFacilityPage = () => {
//   const dispatch = useDispatch();
//   const socket = io("http://localhost:5000");
//   const facilities = useSelector((state) => state.facilities.facilities || []);
//   const [showForm, setShowForm] = useState(false);
//   const [editingFacility, setEditingFacility] = useState(null);

//   const {
//     searchTerm,
//     currentPage,
//     currentItems: currentFacilities,
//     totalPages,
//     handleSearchChange,
//     handlePageChange,
//     totalItems
//   } = useSearchAndPagination(facilities, 7, ['facility_name', 'location']);

//   useEffect(() => {
//     // Initial fetch of facilities
//     dispatch(fetchFacilities());

//     // Socket event listeners
//     const handleFacilityCreated = (data) => {
//       if (data && data.newFacility) {
//         dispatch(facilityCreated(data));
//         toast.success('New facility added');
//       }
//     };

//     const handleFacilityUpdated = (data) => {
//       if (data && data.updatedData) {
//         dispatch(facilityUpdated(data));
//         toast.success('Facility updated');
//       }
//     };

//     const handleFacilityDeleted = (facilityId) => {
//       if (facilityId) {
//         dispatch(facilityDeleted(facilityId));
//         toast.success('Facility deleted');
//       }
//     };

//     // Add socket listeners
//     socket.on('facilityCreated', handleFacilityCreated);
//     socket.on('facilityUpdated', handleFacilityUpdated);
//     socket.on('facilityDeleted', handleFacilityDeleted);

//     // Cleanup socket listeners
//     return () => {
//       socket.off('facilityCreated', handleFacilityCreated);
//       socket.off('facilityUpdated', handleFacilityUpdated);
//       socket.off('facilityDeleted', handleFacilityDeleted);
//     };
//   }, [dispatch]);

//   const handleAddClick = () => {
//     setEditingFacility(null);
//     setShowForm(true);
//   };

//   const handleEditClick = (facility) => {
//     if (facility && facility._id) {
//       setEditingFacility(facility);
//       setShowForm(true);
//     }
//   };

//   const handleDeleteClick = async (facilityId) => {
//     if (facilityId) {
//       try {
//         await dispatch(deleteFacility(facilityId)).unwrap();
//       } catch (error) {
//         toast.error(`Failed to delete facility: ${error.message}`);
//       }
//     }
//   };

//   const handleFormSubmit = async (facilityData) => {
//     try {
//       if (editingFacility && editingFacility._id) {
//         await dispatch(updateFacility({
//           facilityId: editingFacility._id,
//           updatedData: facilityData
//         })).unwrap();
//       } else {
//         await dispatch(createFacility(facilityData)).unwrap();
//       }
//       setShowForm(false);
//       setEditingFacility(null);
//     } catch (error) {
//       toast.error(`Error: ${error.message}`);
//     }
//   };

const API_URL = 'http://localhost:5000'; // Replace with your server URL
const isOnline = () => navigator.onLine;

let socket;
const eventQueue = [];

// Initialize Socket.IO
const initializeSocket = () => {
  socket = io(API_URL, {
    autoConnect: false, // Manually control connection
  });

  socket.on('connect', () => {
    console.log('Socket.IO connected');
    processQueuedEvents(); // Process any queued events when connected
  });

  socket.on('disconnect', () => {
    console.log('Socket.IO disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
    if (!isOnline()) {
      console.log('App is offline. Socket.IO connection paused.');
    }
  });
};

// Connect Socket.IO only when online
const connectSocket = () => {
  if (isOnline()) {
    socket.connect();
  } else {
    console.log('App is offline. Socket.IO connection paused.');
  }
};

// Disconnect Socket.IO when offline
const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};

// Queue or emit Socket.IO events
const emitWhenOnline = (event, data) => {
  if (isOnline()) {
    socket.emit(event, data);
  } else {
    console.log('App is offline. Queuing event:', event);
    eventQueue.push({ event, data });
  }
};

// Process queued events when the app comes back online
const processQueuedEvents = () => {
  console.log('App is online. Processing queued events...');
  while (eventQueue.length > 0) {
    const { event, data } = eventQueue.shift();
    socket.emit(event, data);
  }
};

// Listen for online/offline events
window.addEventListener('offline', () => {
  console.log('App is offline. Pausing Socket.IO...');
  disconnectSocket();
});

window.addEventListener('online', () => {
  console.log('App is online. Reconnecting Socket.IO...');
  connectSocket();
});

// Initialize and connect Socket.IO when the app starts
initializeSocket();
connectSocket();

const CreateFacilityPage = () => {
  const dispatch = useDispatch();
  const facilities = useSelector((state) => state.facilities.facilities || []);
  const [showForm, setShowForm] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);

  // Initialize search and pagination
  const {
    searchTerm,
    currentPage,
    currentItems: currentFacilities,
    totalPages,
    handleSearchChange,
    handlePageChange,
    totalItems
  } = useSearchAndPagination(facilities, 7, ['facility_name', 'location']);

  useEffect(() => {
    // Initial fetch of facilities
    dispatch(fetchFacilities());

    // Socket event listeners
    const handleFacilityCreated = (data) => {
      if (data && data.newFacility) {
        dispatch(facilityCreated(data));
        toast.success('New facility added');
      }
    };

    const handleFacilityUpdated = (data) => {
      if (data && data.updatedData) {
        dispatch(facilityUpdated(data));
        toast.success('Facility updated');
      }
    };

    const handleFacilityDeleted = (facilityId) => {
      if (facilityId) {
        dispatch(facilityDeleted(facilityId));
        toast.success('Facility deleted');
      }
    };

    if (isOnline()) {
      socket.on('facilityCreated', handleFacilityCreated);
      socket.on('facilityUpdated', handleFacilityUpdated);
      socket.on('facilityDeleted', handleFacilityDeleted);
    }

    // Cleanup socket listeners
    return () => {
      socket.off('facilityCreated', handleFacilityCreated);
      socket.off('facilityUpdated', handleFacilityUpdated);
      socket.off('facilityDeleted', handleFacilityDeleted);
    };
  }, [dispatch]);

  const handleAddClick = () => {
    setEditingFacility(null);
    setShowForm(true);
  };

  const handleEditClick = (facility) => {
    if (facility && facility._id) {
      setEditingFacility(facility);
      setShowForm(true);
    }
  };

  const handleDeleteClick = async (facilityId) => {
    if (facilityId) {
      try {
        await dispatch(deleteFacility(facilityId)).unwrap();
        emitWhenOnline('deleteFacility', facilityId); // Emit event when online
      } catch (error) {
        toast.error(`Failed to delete facility: ${error.message}`);
      }
    }
  };

  const handleFormSubmit = async (facilityData) => {
    try {
      if (editingFacility && editingFacility._id) {
        await dispatch(updateFacility({
          facilityId: editingFacility._id,
          updatedData: facilityData
        })).unwrap();
        emitWhenOnline('updateFacility', { 
          facilityId: editingFacility._id, 
          updatedData: facilityData 
        });
      } else {
        const createdFacility = await dispatch(createFacility(facilityData)).unwrap();
        emitWhenOnline('createFacility', createdFacility); // Emit event when online
      }
      setShowForm(false);
      setEditingFacility(null);
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    }
  };

  return (
    <div className="container p-4 md:mx-2 lg:ml-72">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-2 md:space-y-0">
        <h2 className="text-xl sm:text-2xl border p-1 rounded-md bg-blue-100 font-bold">Facilities</h2>
        
        <SearchBar 
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          placeholder="Search facilities..."
        />

        <button
          onClick={handleAddClick}
          className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition flex items-center space-x-2"
        >
          <FaPlus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Add Facility</span>
        </button>
      </div>

      <div className="space-y-4 md:space-y-2 md:gap-x-2">
        {Array.isArray(currentFacilities) && currentFacilities.length > 0 ? (
          currentFacilities.map((facility) => (
            facility && facility._id ? (
              <div
                key={facility._id}
                className="p-4 border rounded shadow flex flex-col md:flex-row justify-between items-start md:gap-x-4 md:items-center space-y-2 md:space-y-0"
              >
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold">{facility.facility_name}</h3>
                  <p className="text-gray-600">{facility.location}</p>
                </div>
                <div className="flex space-x-3 mt-2 md:mt-0">
                  <button onClick={() => handleEditClick(facility)} className="text-blue-500 hover:text-blue-700">
                    <FaEdit className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDeleteClick(facility._id)} className="text-red-500 hover:text-red-700">
                    <FaTrash className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : null
          ))
        ) : (
          <p className="text-gray-600">No facilities available</p>
        )}
      </div>

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemsPerPage={10}
        totalItems={totalItems}
      />

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 mx-2 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => {
                setShowForm(false);
                setEditingFacility(null);
              }}
            >
              &times;
            </button>
            <FacilityForm
              onSubmit={handleFormSubmit}
              facility={editingFacility}
              onClose={() => {
                setShowForm(false);
                setEditingFacility(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
  
};

export default CreateFacilityPage;
