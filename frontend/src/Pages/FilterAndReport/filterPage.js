import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { filterTasks, resetFilteredTasks } from "../../features/taskSlice";
import FilterForm from "../../Components/filterAndReportComponents/filterForm";
import TaskTable from "../../Components/filterAndReportComponents/taskTable";
import { useResources } from "../../hooks/useResources"; // Import your custom hook
import { useUsers } from '../../hooks/useUsers';
const FilterPage = () => {
  const dispatch = useDispatch();

  // Get data from Redux store (fetched globally in App.js)
  const { tasks, filteredTasks, currentView, status } = useSelector((state) => state.tasks);
  const user = useSelector((state) => state.auth.user);
  const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'N/A' : 'N/A';

  // const { users } = useSelector((state) => state.users);
  const { users } = useUsers();
  const { resourceTypes, loading: resourceTypesLoading } = useSelector((state) => state.resourceTypes);

  // Get resource IDs for the hook
  const resourceTypeIds = resourceTypes?.map(type => type._id) || [];
  const { allResourcesByType, loading: resourcesLoading } = useResources(
    resourceTypeIds,
    { fetchAllOnMount: true } // Tell the hook to fetch all resources
  );
  // Use the resources hook
  // const { allResourcesByType, loading: resourcesLoading } = useResources(resourceTypeIds);
  const [filterMetadata, setFilterMetadata] = React.useState({ clientName: userName, dateRange: 'All Time' });

  // Handle filtering
  const handleFilter = (filters) => {
    const { startDate, endDate } = filters.filters || {};
    const range = (startDate && endDate)
      ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
      : 'All Time';

    setFilterMetadata(prev => ({
      ...prev,
      dateRange: range
    }));
    dispatch(filterTasks(filters));
  };

  // Determine which tasks to display
  const displayedTasks = currentView === "filteredTasks" ? filteredTasks : tasks;

  // Keep client name in sync with logged-in user
  React.useEffect(() => {
    setFilterMetadata(prev => ({
      ...prev,
      clientName: userName
    }));
  }, [userName]);

  // Reset filters
  const resetFilters = () => {
    setFilterMetadata({ clientName: userName, dateRange: 'All Time' });
    dispatch(resetFilteredTasks());
  };

  return (
    <div className="p-6 lg:ml-80">
      <FilterForm
        onFilter={handleFilter}
        onReset={resetFilters}
        users={users}
        resourceTypes={resourceTypes}
        allResourcesByType={allResourcesByType}
        resourcesLoading={resourcesLoading || resourceTypesLoading}
      />
      {status === "loading" ? (
        <p>Loading tasks...</p>
      ) : (
        <TaskTable
          tasks={displayedTasks}
          resourceTypes={resourceTypes}
          metadata={filterMetadata}
        />
      )}
    </div>
  );
};

export default FilterPage;