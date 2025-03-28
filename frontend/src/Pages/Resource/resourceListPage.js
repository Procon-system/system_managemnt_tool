import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
// import { fetchResourcesByType } from '../redux/slices/resourceSlice';
import ResourceTable from '../../Components/resourceComponents/resourceTable';
import DynamicResourceForm from '../../Components/resourceComponents/dynamicResourceForm';
import React, { useState,useEffect } from 'react';
import { FiTool, FiSettings, FiPackage } from "react-icons/fi";
import LoadingSpinner from '../../Components/common/LoadingSpinner';
import ErrorAlert from '../../Components/common/ErrorAlert';

const ResourceListPage = () => {
  const { typeId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [showForm, setShowForm] = useState(false);
  const { resources, loading, error } = useSelector((state) => state.resources);
  const resourceType = useSelector((state) => 
    state.resourceTypes.resourceTypes.find(type => type._id === typeId)
  );

  useEffect(() => {
    if (typeId) {
    //   dispatch(fetchResourcesByType(typeId));
    }
  }, [typeId, dispatch]);
  const renderDynamicIcon = (iconName) => {
    const iconComponents = {
      wrench: <FiTool size={16} />,
      FiTool: <FiTool size={16} />,
      settings: <FiSettings size={16} />,
      package: <FiPackage size={16} />,
      // Add more icon mappings as needed
    };
    
    return iconComponents[iconName] || 
      <span className="text-sm">{iconName}</span>; // Fallback for unknown icons
  };
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          {resourceType?.icon && (
            <span className="mr-2" style={{ color: resourceType.color }}>
              {renderDynamicIcon(resourceType.icon)}
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
            // dispatch(fetchResourcesByType(typeId));
          }}
        />
      ) : (
        <ResourceTable 
          resources={resources} 
          resourceType={resourceType}
          onEdit={(resourceId) => navigate(`/resources/${typeId}/edit/${resourceId}`)}
        />
      )}
    </div>
  );
};

export default ResourceListPage;