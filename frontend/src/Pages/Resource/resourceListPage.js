
import { useParams} from 'react-router-dom';
import { useSelector,useDispatch } from 'react-redux';
import { updateResource, deleteResource ,clearError} from '../../features/resourceSlice';
import ResourceTable from '../../Components/resourceComponents/resourceTable';
import DynamicResourceForm from '../../Components/resourceComponents/dynamicResourceForm';
import React, { useState ,useEffect ,useRef} from 'react';
import LoadingSpinner from '../../Components/common/LoadingSpinner';
import ErrorAlert from '../../Components/common/ErrorAlert';
import RenderDynamicIcon from '../../Components/common/RenderDynamicIcon';
import { useResources } from '../../hooks/useResources'; 
import { FiEdit } from 'react-icons/fi';
import EditResourceTypeModal from '../../Components/resourceTypeComponents/editResourceTypeModal';
import { toast } from 'react-toastify';
const ConfirmationModal = ({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  confirmText = "Confirm",
  // kept for compatibility; not rendered
  cancelText = "Cancel",
}) => {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const t = setTimeout(() => confirmRef.current?.focus(), 0);

    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Enter") {
        e.preventDefault();
        onConfirm?.();
      }
    };
    document.addEventListener("keydown", handleKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Light backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-none"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        className="relative mx-4 w-[92vw] max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close (X) */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full
                     text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          X 
        </button>

        <h3 id="confirm-title" className="pr-10 text-lg font-semibold text-gray-900">
          {title}
        </h3>
        <p id="confirm-desc" className="mt-2 text-sm text-gray-700">
          {message}
        </p>

        <div className="mt-6 flex justify-end">
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white
                       bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
const ResourceListPage = () => {
  const { typeId } = useParams();
  const [showForm, setShowForm] = useState(false);
  const [isEditTypeModalOpen, setIsEditTypeModalOpen] = useState(false);

  // State for confirmation modal
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [pendingDeleteResource, setPendingDeleteResource] = useState(null); // Stores resource ID and warning message

  const { 
    typeSpecificResources: resources,
    loading, 
    error,
    // refreshResources
  } = useResources(
    [typeId],
    { fetchAllOnMount: true }
  );
  
  const resourceType = useSelector((state) => 
    state.resourceTypes.resourceTypes.find(type => type._id === typeId)
  );
  const dispatch = useDispatch();

  // Get the error from the slice, which might contain our warning object
  const sliceError = useSelector(state => state.resources.error);

  // Effect to show the confirmation modal if a warning is received
  useEffect(() => {
    if (sliceError && !sliceError.canDelete && sliceError.message && sliceError.id) {
      setPendingDeleteResource({
        id: sliceError.id,
        message: sliceError.message
      });
      setIsConfirmationModalOpen(true);
    }
  }, [sliceError]);

  const handleEdit = async (resourceId, updatedData) => {
    await dispatch(updateResource({ id: resourceId, updatedData }));
    // refreshResources(); 
    toast.success("Resource updated successfully!");
  };

  const handleDelete = async (resourceId) => {
    // Attempt deletion without force initially
    const resultAction = await dispatch(deleteResource({ id: resourceId, force: false }));
   
      if (deleteResource.fulfilled.match(resultAction)) {
        toast.success("Resource deleted successfully!"); 

     
    } 
    
  };

  const handleConfirmDelete = async () => {
    if (pendingDeleteResource) {
      // Dispatch delete with force=true
      const resultAction = await dispatch(deleteResource({ id: pendingDeleteResource.id, force: true }));
     
      if (deleteResource.fulfilled.match(resultAction)) {
        toast.success("Resource and its associated bookings deleted successfully!"); 
      
      } else {
        toast.error("Failed to delete resource even after confirmation."); 
        console.error("Error during forced deletion:", resultAction.payload);
      }
      setIsConfirmationModalOpen(false);
      setPendingDeleteResource(null); 
      dispatch(clearError()); 
    }
  };

  const handleCancelDelete = () => {
    setIsConfirmationModalOpen(false);
    setPendingDeleteResource(null);
    dispatch(clearError()); 
  };

  if (loading) return <LoadingSpinner />;
    if (sliceError && sliceError.message && sliceError.canDelete === undefined) { 
      return <ErrorAlert message={sliceError.message} />;
  }


  return (
    <>
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          {resourceType?.icon && (
            <span className="mr-2" style={{ color: resourceType.color }}>
              {RenderDynamicIcon(resourceType.icon, 20, "text-blue-500")}
            </span>
          )}
          {resourceType?.name || 'Resources'}
        </h1>
          <div className="flex items-center space-x-3">
           {resourceType && (
            <button 
              className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 shadow-sm"
              onClick={() => setIsEditTypeModalOpen(true)}
            >
              <FiEdit className="mr-2"/>
              Edit This Type
            </button>
          )}
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 shadow-sm"
            onClick={() => setShowForm(true)}
          >
            Add New Resource
          </button>
        </div>
      </div>
      
      {showForm ? (
        <DynamicResourceForm 
          resourceType={resourceType} 
          onCancel={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            // refreshResources([typeId]);
          }}
        />
      ) : (
        <ResourceTable 
          resources={resources} 
          resourceType={resourceType}
          onEdit={handleEdit}
          onDelete={handleDelete} // This now initiates the process
        />
      )}
    </div>
    <EditResourceTypeModal
      isOpen={isEditTypeModalOpen}
      onClose={() => setIsEditTypeModalOpen(false)}
      resourceTypeToEdit={resourceType}
    />

    {/* Confirmation Modal */}
    <ConfirmationModal
      isOpen={isConfirmationModalOpen}
      onClose={handleCancelDelete}
      title="Confirm Resource Deletion"
      message={pendingDeleteResource?.message || "Are you sure you want to delete this resource?"}
      onConfirm={handleConfirmDelete}
      confirmText="Delete Anyway"
    />
  </>
  );
};

export default ResourceListPage;