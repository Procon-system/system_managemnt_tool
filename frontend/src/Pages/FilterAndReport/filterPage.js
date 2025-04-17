import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { filterTasks, resetFilteredTasks } from "../../features/taskSlice";
import FilterForm from "../../Components/filterAndReportComponents/filterForm";
import TaskTable from "../../Components/filterAndReportComponents/taskTable";

const FilterPage = () => {
  const dispatch = useDispatch();

  // Get data from Redux store (fetched globally in App.js)
  const { tasks, filteredTasks, currentView, status } = useSelector((state) => state.tasks);
  const { users } = useSelector((state) => state.users);

  // Handle filtering
  const handleFilter = (filters) => {
  
    dispatch(filterTasks(filters));
  };

  // Reset filters
  const resetFilters = () => {
    dispatch(resetFilteredTasks());
  };

  // Determine which tasks to display
  const displayedTasks = currentView === "filteredTasks" ? filteredTasks : tasks;

  return (
    <div className="p-6 lg:ml-80">
     
      <FilterForm
        onFilter={handleFilter}
        onReset={resetFilters}
        users={users}
       
      />
      {status === "loading" ? (
        <p>Loading tasks...</p>
      ) : (
        <TaskTable tasks={displayedTasks} />
      )}
    </div>
  );
};

export default FilterPage;
