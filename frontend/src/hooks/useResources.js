
// hooks/useResources.js
import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchResourcesByType } from '../features/resourceSlice';

export const useResources = (typeIds = []) => {
  const dispatch = useDispatch();
  const resourcesState = useSelector(state => state.resources);
  
  // Track which types have been fetched
  const [fetchedTypes, setFetchedTypes] = useState(new Set());

  // Fetch resources for specified types
  useEffect(() => {
    const typesToFetch = typeIds.filter(typeId => !fetchedTypes.has(typeId));
    
    if (typesToFetch.length > 0) {
      typesToFetch.forEach(typeId => {
        dispatch(fetchResourcesByType(typeId));
        setFetchedTypes(prev => new Set(prev).add(typeId));
      });
    }
  }, [dispatch, typeIds.join(','), fetchedTypes]);

  // Memoized resource grouping for better performance
  const resourcesByType = useMemo(() => {
    const map = {};
    typeIds.forEach(typeId => {
      map[typeId] = resourcesState.data?.resources?.filter(res => 
        res.type?._id === typeId || res.typeId === typeId
      ) || [];
    });
    return map;
  }, [resourcesState.data?.resources, typeIds.join(',')]);

  // For TaskForm - all resources combined
  const allResources = resourcesState.data?.resources || [];

  // For ResourceListPage - resources for specific types
  const typeSpecificResources = typeIds.length === 1 
    ? resourcesByType[typeIds[0]] || []
    : [];

  const refreshResources = (idsToRefresh = typeIds) => {
    idsToRefresh.forEach(typeId => {
      dispatch(fetchResourcesByType(typeId));
    });
  };

  return {
    // For TaskForm
    resources: allResources,
    getResourcesByType: (typeId) => resourcesByType[typeId] || [],
    
    // For ResourceListPage
    typeSpecificResources,
    
    // Common
    loading: resourcesState.loading,
    error: resourcesState.error,
    refreshResources,
    resourcesByType
  };
};