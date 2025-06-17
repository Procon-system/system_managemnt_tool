
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAnalyticsData, setAnalyticsFilters } from '../../features/analyticsSlice';
import FilterPanel from '../../Components/analyticsComponents/filterPanel';
import KPISection from '../../Components/analyticsComponents/KPISection';
import DataGrid from '../../Components/analyticsComponents/dataGrid';
import ActionBar from '../../Components/analyticsComponents/actionBar';
import CustomColumnDialog from '../../Components/analyticsComponents/customColumnDialog';
import LoadingSpinner from '../../Components/common/LoadingSpinner';
import ErrorAlert from '../../Components/common/ErrorAlert';

const TaskAnalytics = () => {
  const dispatch = useDispatch();

  // This is UI state, which is perfectly fine to keep local
  const [showCustomColumnDialog, setShowCustomColumnDialog] = useState(false);

  // --- SELECT DATA FROM THE REDUX STORE ---
  // Instead of useTaskAnalytics, we use useSelector to get state from the analytics slice
  const {
    gridTasks,        // The transformed data for the grid
    kpis,             // The calculated KPIs
    filters,          // The current filter state, managed by Redux
    status,           // The loading status ('idle', 'loading', 'succeeded', 'failed')
    error,            // The error message, if any
    rawTasks          // The raw API data for the custom column dialog
  } = useSelector((state) => state.analytics);


  // --- EFFECT TO FETCH DATA WHEN FILTERS CHANGE ---
  // This replaces the useEffect inside the old hook
  useEffect(() => {
    // We only trigger a fetch if the filters are in a valid state (e.g., dates are set).
    // You can adjust this condition based on your requirements.
    // if (filters.startDate && filters.endDate) {
      // Dispatch the async thunk to fetch data. Redux Toolkit handles the logic.
      dispatch(fetchAnalyticsData(filters));
    // }
    // This effect re-runs whenever the `filters` object in the Redux store changes.
  }, [filters, dispatch]);


  // --- HANDLER TO UPDATE FILTERS IN THE REDUX STORE ---
  const handleApplyFilters = (newFilterValues) => {
    // Dispatch the `setAnalyticsFilters` action to update the state in Redux.
    // This state change will be detected by the useEffect above, triggering a re-fetch.
    dispatch(setAnalyticsFilters(newFilterValues));
  };
  
  // No changes needed for this handler
  const handleAddCustomColumn = () => {
    setShowCustomColumnDialog(true);
  };
  
  // --- RENDER LOGIC BASED ON REDUX STATE ---
  if (status === 'loading') return <LoadingSpinner />;
  if (status === 'failed') return <ErrorAlert message={error} />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Task Analytics Dashboard
          </h1>
          <ActionBar onAddCustomColumn={handleAddCustomColumn} />
        </div>

        <div className="space-y-6">
          {/* All child components now receive their props directly from the Redux store's state */}
          <FilterPanel 
            filters={filters} // Pass the filters from Redux
            onApplyFilters={handleApplyFilters} // The handler now dispatches to Redux
          />
          
          <KPISection kpiData={kpis} />
          
          <div className="bg-white rounded-lg shadow">
            <DataGrid 
              tasks={gridTasks} // Pass the transformed gridTasks from Redux
            />
          </div>
        </div>

        {showCustomColumnDialog && (
          <CustomColumnDialog 
            onClose={() => setShowCustomColumnDialog(false)}
            onAdd={(columnConfig) => {
              console.log('Adding custom column:', columnConfig);
              setShowCustomColumnDialog(false);
            }}
            // Pass the raw, untransformed data to the dialog for dynamic field generation
            rawApiTasks={rawTasks} 
          />
        )}
      </div>
    </div>
  );
};

export default TaskAnalytics;