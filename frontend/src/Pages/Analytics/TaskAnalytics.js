
// import React, { useState, useEffect } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { fetchAnalyticsData, setAnalyticsFilters } from '../../features/analyticsSlice';
// import { useTaskAnalytics } from '../../hooks/useTaskAnalytics';

// import FilterPanel from '../../Components/analyticsComponents/filterPanel';
// import KPISection from '../../Components/analyticsComponents/KPISection';
// import DataGrid from '../../Components/analyticsComponents/dataGrid';
// import ActionBar from '../../Components/analyticsComponents/actionBar';
// import CustomColumnDialog from '../../Components/analyticsComponents/customColumnDialog';
// import LoadingSpinner from '../../Components/common/LoadingSpinner';
// import ErrorAlert from '../../Components/common/ErrorAlert';

// const TaskAnalytics = () => {
//   const dispatch = useDispatch();
//   const [showCustomColumnDialog, setShowCustomColumnDialog] = useState(false);
//   const [customColumns, setCustomColumns] = useState([]); 

//   // Select raw data and status from the Redux store
//   const {
//     rawTasks,
//     filters,
//     status,
//     error,
//   } = useSelector((state) => state.analytics);

//   const { processedTasks, dynamicColumns, kpis } = useTaskAnalytics({
//     populatedTasks: rawTasks,
//     customColumns: customColumns,
//   });

//   useEffect(() => {
//     dispatch(fetchAnalyticsData(filters));
//   }, [filters, dispatch]);

//   // --- EVENT HANDLERS ---
//   const handleApplyFilters = (newFilterValues) => {
//     dispatch(setAnalyticsFilters(newFilterValues));
//   };

//   const handleAddCustomColumn = (columnConfig) => {
//     // Add the new column configuration to our local state
//     setCustomColumns(prev => [...prev, columnConfig]);
//     // Close the dialog after adding the column
//     setShowCustomColumnDialog(false);
//   };
  
//   const isLoading = status === 'loading' && rawTasks.length === 0;

//   return (
//     <div className="min-h-screen bg-gray-50 p-4 md:p-6">
//       <div className="max-w-screen-2xl mx-auto">
//         <div className="flex items-center justify-between mb-6">
//           <h1 className="text-3xl font-bold text-gray-900">
//             Task Analytics Dashboard
//           </h1>
//           <ActionBar onAddCustomColumn={() => setShowCustomColumnDialog(true)} />
//         </div>

//         <div className="space-y-6">
//           <FilterPanel 
//             filters={filters}
//             onApplyFilters={handleApplyFilters}
//           />
          
//           {isLoading ? (
//             <div className="flex justify-center items-center py-20 bg-white rounded-lg shadow">
//                 <LoadingSpinner />
//             </div>
//           ) : error ? (
//             <ErrorAlert message={error} />
//           ) : rawTasks.length === 0 && status === 'succeeded' ? (
//             <div className="text-center py-16 bg-white rounded-lg shadow">
//               <h3 className="text-lg font-medium text-gray-800">No Data Available</h3>
//               <p className="text-sm text-gray-500 mt-2">No completed tasks were found for the selected filters.</p>
//             </div>
//           ) : (
//             <>
              
//               <KPISection kpis={kpis} />
//               <div className="bg-white rounded-lg shadow overflow-hidden">
//                 <DataGrid 
//                   data={processedTasks} 
//                   columns={dynamicColumns}
//                 />
//               </div>
//             </>
//           )}
//         </div>

//         {/* --- DYNAMIC DIALOG --- */}
//         {showCustomColumnDialog && (
//           <CustomColumnDialog 
//             onClose={() => setShowCustomColumnDialog(false)}
//             onAdd={handleAddCustomColumn}
//             availableColumns={dynamicColumns} 
//           />
//         )}
//       </div>
//     </div>
//   );
// };

// export default TaskAnalytics;
// src/pages/TaskAnalytics.js

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAnalyticsData } from '../../features/analyticsSlice';
import { useTaskAnalytics } from '../../hooks/useTaskAnalytics';

import FilterPanel from '../../Components/analyticsComponents/filterPanel';
import KPISection from '../../Components/analyticsComponents/KPISection';
import DataGrid from '../../Components/analyticsComponents/dataGrid';
import ActionBar from '../../Components/analyticsComponents/actionBar';
import CustomColumnDialog from '../../Components/analyticsComponents/customColumnDialog';
import LoadingSpinner from '../../Components/common/LoadingSpinner';
import ErrorAlert from '../../Components/common/ErrorAlert';

const TaskAnalytics = () => {
    const dispatch = useDispatch();

    // --- LOCAL STATE MANAGEMENT FOR FILTERS AND UI ---
    const [filters, setFilters] = useState({
        dateRange: { start: '', end: '' },
        userIds: [],
        resourceIds: [],
    });
    const [showCustomColumnDialog, setShowCustomColumnDialog] = useState(false);
    const [customColumns, setCustomColumns] = useState([]);

    // --- DATA FROM REDUX (The master dataset) ---
    // Make sure your Redux slice stores the data in `allTasks`
    const { allTasks: rawTasks = [], status, error } = useSelector((state) => state.analytics);

    // --- PROCESSING HOOK (Applies local filters to master data) ---
    const {
        processedTasks,
        dynamicColumns,
        kpis,
        availableUsers,
        availableResources
    } = useTaskAnalytics({
        populatedTasks: rawTasks,
        filters: filters,
        customColumns: customColumns,
    });

    // --- DATA FETCHING (Only re-fetches when date range changes) ---
    useEffect(() => {
        dispatch(fetchAnalyticsData({
            startDate: filters.dateRange.start,
            endDate: filters.dateRange.end
        }));
    }, [filters.dateRange, dispatch]);

    // --- EVENT HANDLERS (Updates local state instantly) ---
    const handleApplyFilters = (newFilterValues) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            ...newFilterValues,
            dateRange: newFilterValues.dateRange
                ? { ...prevFilters.dateRange, ...newFilterValues.dateRange }
                : prevFilters.dateRange
        }));
    };

    const handleAddCustomColumn = (columnConfig) => {
        setCustomColumns(prev => [...prev, columnConfig]);
        setShowCustomColumnDialog(false);
    };

    const isLoading = status === 'loading' && rawTasks.length === 0;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-screen-2xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Task Analytics Dashboard</h1>
                    <ActionBar onAddCustomColumn={() => setShowCustomColumnDialog(true)} />
                </div>

                <div className="space-y-6">
                    <FilterPanel
                        filters={filters}
                        onApplyFilters={handleApplyFilters}
                        availableUsers={availableUsers}
                        availableResources={availableResources}
                    />

                    {isLoading ? (
                        <div className="flex justify-center py-20"><LoadingSpinner /></div>
                    ) : error ? (
                        <ErrorAlert message={error} />
                    ) : (
                        <>
                            {rawTasks.length === 0 && status === 'succeeded' ? (
                                <div className="text-center py-16 bg-white rounded-lg shadow">
                                    <h3 className="text-lg font-medium text-gray-800">No Data Available</h3>
                                    <p className="text-sm text-gray-500 mt-2">No completed tasks were found for the selected date range.</p>
                                </div>
                            ) : (
                                <>
                                    <KPISection kpis={kpis} />
                                    <div className="bg-white rounded-lg shadow overflow-hidden">
                                        <DataGrid
                                            data={processedTasks}
                                            columns={dynamicColumns}
                                        />
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>

                {showCustomColumnDialog && (
                    <CustomColumnDialog
                        onClose={() => setShowCustomColumnDialog(false)}
                        onAdd={handleAddCustomColumn}
                        availableColumns={dynamicColumns}
                    />
                )}
            </div>
        </div>
    );
};

export default TaskAnalytics;
