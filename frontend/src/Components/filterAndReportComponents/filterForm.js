import React, { useState } from 'react';
import { SelectInput } from "../taskComponents/selectInput";

const ResourceTypeFilter = ({ 
  resourceTypes, 
  onFilterChange,
  initialFilters = []
}) => {
  const [selectedResources, setSelectedResources] = useState(
    initialFilters.reduce((acc, filter) => {
      if (filter.resource) {
        acc[filter.type] = filter.resource;
      }
      return acc;
    }, {})
  );

  const handleResourceChange = (typeId, value) => {
    const newSelection = { ...selectedResources, [typeId]: value };
    setSelectedResources(newSelection);
    
    // Convert to filter format and update parent
    const filters = Object.entries(newSelection)
      .filter(([_, resourceId]) => resourceId !== null)
      .map(([typeId, resourceId]) => ({ type: typeId, resource: resourceId }));
    
    onFilterChange(filters);
  };

  // Dynamic grid calculation
  const calculateGridLayout = (count) => {
    if (count <= 4) return { base: 2, md: Math.min(count, 4) };
    if (count <= 6) return { base: 2, md: 3, lg: Math.min(count, 6) };
    return { base: 2, md: 3, lg: 4 }; // Max 4 columns for many items
  };

  const gridConfig = calculateGridLayout(resourceTypes.length);
  const gridClass = `grid grid-cols-${gridConfig.base} md:grid-cols-${gridConfig.md} lg:grid-cols-${gridConfig.lg} gap-4`;

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700">Select Resources</h3>
      
      <div className={gridClass}>
        {resourceTypes.map(type => {
          const resourcesOfType = type.resources || [];
          return (
            <div key={type._id} className="space-y-2">
              <label className="block text-sm font-medium text-gray-600">
                {type.name}
              </label>
              <SelectInput
                value={selectedResources[type._id] || null}
                onChange={(value) => handleResourceChange(type._id, value)}
                options={[
                  { label: `All ${type.name}`, value: null },
                  ...resourcesOfType.map(res => ({
                    label: res.displayName || res.name,
                    value: res._id
                  }))
                ]}
                isClearable={false}
                className="w-full"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
const FilterForm = ({ 
  onFilter, 
  onReset, 
  users, 
  resourceTypes, // Now expects array of { _id, name, resources: [] }
  teams,
  statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
    { value: 'impossible', label: 'Impossible' }
  ],
  
}) => {
  const [filters, setFilters] = useState({
    assignedTo: null,
    startDate: "",
    endDate: "",
    status: "",
    
    resourceFilters: [],
    search: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleResourceFiltersChange = (resourceFilters) => {
    setFilters(prev => ({ ...prev, resourceFilters }));
  };

  const handleApplyFilters = () => {
    // Convert to API format
    const apiFilters = {
      ...filters,
      resources: filters.resourceFilters.map(filter => ({
        resource: filter.resource,
        relationshipType: filter.relationshipType,
        required: filter.required
      }))
    };
    onFilter(apiFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      assignedTo: null,
      startDate: "",
      endDate: "",
      status: "",
      
      resourceFilters: [],
      search: ""
    });
    onReset();
  };

  return (
    <div className="mb-4 p-4 border rounded-lg shadow-md bg-white">
      <h2 className="text-lg font-semibold mb-4">Filter Tasks</h2>

      <div className="space-y-6">
        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Search</label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleChange}
              className="p-2 border rounded w-full"
              placeholder="Search in title/notes"
            />
          </div>

          <SelectInput
            label="Status"
            name="status"
            value={filters.status}
            onChange={handleChange}
            options={statusOptions}
            isClearable
          />
           <SelectInput
            label="Assigned To"
            name="assignedTo"
            value={filters.assignedTo}
            onChange={handleChange}
            options={users?.map(user => ({
              label: `${user.first_name} ${user.last_name}`,
              value: user._id
            })) || []}
            isClearable
          />
         
        </div>


        {/* Resource Type Filters */}
        <ResourceTypeFilter 
          resourceTypes={resourceTypes}
          onFilterChange={handleResourceFiltersChange}
          initialFilters={filters.resourceFilters}
        />

        {/* Date Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleChange}
              className="p-2 border rounded w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleChange}
              className="p-2 border rounded w-full"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button 
            onClick={handleApplyFilters}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Apply Filters
          </button>
          <button 
            onClick={handleResetFilters}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterForm;