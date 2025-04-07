// import { useParams } from 'react-router-dom';
// import { useSelector, useDispatch } from 'react-redux';
// import { fetchResourcesByType, updateResource, deleteResource } from '../../features/resourceSlice';
// import ResourceTable from '../../Components/resourceComponents/resourceTable';
// import DynamicResourceForm from '../../Components/resourceComponents/dynamicResourceForm';
// import React, { useState, useEffect } from 'react';
// import LoadingSpinner from '../../Components/common/LoadingSpinner';
// import ErrorAlert from '../../Components/common/ErrorAlert';
// import RenderDynamicIcon from '../../Components/common/RenderDynamicIcon';
// const ResourceListPage = () => {
//   const { typeId } = useParams();
//   const dispatch = useDispatch();
  
//   const [showForm, setShowForm] = useState(false);
//   const { data, loading, error } = useSelector((state) => state.resources);
//   // const resources = data?.resources || [];
//   const resources = data?.resourcesByType?.[typeId] || 
//                    data?.resources?.filter(res => res.type?._id === typeId) || [];

//   const resourceType = useSelector((state) => 
//     state.resourceTypes.resourceTypes.find(type => type._id === typeId)
//   );

//   // Use type-specific resources if available, otherwise filter
  
//   useEffect(() => {
//     if (typeId) {
//       dispatch(fetchResourcesByType(typeId));
//     }
//   }, [typeId, dispatch]);

//   const handleEdit = async (resourceId, updatedData) => {
//     await dispatch(updateResource({ id: resourceId, updatedData }));
//     dispatch(fetchResourcesByType(typeId)); // Refresh the list
//   };

//   const handleDelete = async (resourceId) => {
//     if (window.confirm('Are you sure you want to delete this resource?')) {
//       await dispatch(deleteResource(resourceId));
//       dispatch(fetchResourcesByType(typeId)); // Refresh the list
//     }
//   };

  

//   if (loading) return <LoadingSpinner />;
//   if (error) return <ErrorAlert message={error} />;

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-6">
//       <div className="flex items-center justify-between mb-6">
//         <h1 className="text-2xl font-bold flex items-center">
//         {resourceType?.icon && (
//     <span className="mr-2" style={{ color: resourceType.color }}>
//       {RenderDynamicIcon(resourceType.icon, 20, "text-blue-500")}
//     </span>
//   )}
//   {resourceType?.name || 'Resources'}
//         </h1>
//         <button 
//           className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//           onClick={() => setShowForm(true)}
//         >
//           Add New Resource
//         </button>
//       </div>
      
//       {showForm ? (
//         <DynamicResourceForm 
//           resourceType={resourceType} 
//           onCancel={() => setShowForm(false)}
//           onSuccess={() => {
//             setShowForm(false);
//             dispatch(fetchResourcesByType(typeId));
//           }}
//         />
//       ) : (
//         <ResourceTable 
//           resources={resources} 
//           resourceType={resourceType}
//           onEdit={handleEdit}
//           onDelete={handleDelete}
//         />
//       )}
//     </div>
//   );
// };

// export default ResourceListPage;
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { updateResource, deleteResource } from '../../features/resourceSlice';
import ResourceTable from '../../Components/resourceComponents/resourceTable';
import DynamicResourceForm from '../../Components/resourceComponents/dynamicResourceForm';
import React, { useState } from 'react';
import LoadingSpinner from '../../Components/common/LoadingSpinner';
import ErrorAlert from '../../Components/common/ErrorAlert';
import RenderDynamicIcon from '../../Components/common/RenderDynamicIcon';
import { useResources } from '../../hooks/useResources'; // Import the custom hook

const ResourceListPage = () => {
  const { typeId } = useParams();
  const [showForm, setShowForm] = useState(false);
  
  // Use the hook for this specific type
  const { 
    typeSpecificResources: resources,
    loading, 
    error,
    refreshResources
  } = useResources([typeId]);

  const resourceType = useSelector((state) => 
    state.resourceTypes.resourceTypes.find(type => type._id === typeId)
  );

  const handleEdit = async (resourceId, updatedData) => {
    await updateResource({ id: resourceId, updatedData });
    refreshResources();
  };

  const handleDelete = async (resourceId) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      await deleteResource(resourceId);
      refreshResources();
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
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
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => setShowForm(true)}
        >
          Add New Resource
        </button>
      </div>
      
      {showForm ? (
        <DynamicResourceForm 
          resourceType={resourceType} 
          onCancel={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            refreshResources([typeId]); // Use the hook's refresh function
          }}
        />
      ) : (
        <ResourceTable 
          resources={resources} 
          resourceType={resourceType}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default ResourceListPage;