
import React from 'react';

/**
 * A controlled component for displaying and updating analytics filters.
 * It receives its state via props and communicates changes via a callback.
 *
 * @param {object} filters - The current filter state from Redux.
 * @param {function} onApplyFilters - The function to call to dispatch filter changes to Redux.
 * @param {Array} availableUsers - An array of user objects for the user filter dropdown.
 * @param {Array} availableResources - An array of resource objects for the resource filter dropdown.
 */
const FilterPanel = ({
  filters,
  onApplyFilters,
  availableUsers = [],      // Default to empty array to prevent map errors on initial render
  availableResources = [],  // Default to empty array
}) => {
  /**
   * Handles changes to the start or end date fields.
   */
  const handleDateRangeChange = (field, value) => {
    // Dispatch an update for only the dateRange part of the filters
    onApplyFilters({
      dateRange: {
        ...filters.dateRange,
        [field]: value,
      },
    });
  };

  /**
   * Sets a predefined date range (e.g., 'Last 7 Days').
   */
  const setQuickDateRange = (range) => {
    const end = new Date();
    const start = new Date();

    switch (range) {
      case 'last7': start.setDate(end.getDate() - 7); break;
      case 'thisMonth': start.setDate(1); break;
      case 'lastQuarter': start.setMonth(end.getMonth() - 3); break;
      default: return;
    }

    onApplyFilters({
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      },
    });
  };

  /**
   * Adds a user's ID to the filter list if it's not already present.
   */
  const addUser = (userId) => {
    if (userId && !filters.userIds.includes(userId)) {
      onApplyFilters({ userIds: [...filters.userIds, userId] });
    }
  };

  /**
   * Removes a user's ID from the filter list.
   */
  const removeUser = (userId) => {
    onApplyFilters({ userIds: filters.userIds.filter(id => id !== userId) });
  };

  /**
   * Adds a resource's ID to the filter list.
   */
  const addResource = (resourceId) => {
    if (resourceId && !filters.resourceIds.includes(resourceId)) {
      onApplyFilters({ resourceIds: [...filters.resourceIds, resourceId] });
    }
  };

  /**
   * Removes a resource's ID from the filter list.
   */
  const removeResource = (resourceId) => {
    onApplyFilters({ resourceIds: filters.resourceIds.filter(id => id !== resourceId) });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" /></svg>
        <h2 className="text-lg font-semibold text-gray-900">Filters & Date Range</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
        {/* Date Range Section */}
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Date Range</label>
            <div className="flex gap-2">
                <button type="button" onClick={() => setQuickDateRange('last7')} className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50">Last 7 Days</button>
                <button type="button" onClick={() => setQuickDateRange('thisMonth')} className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50">This Month</button>
            </div>
            <div className="flex gap-2 items-center">
                <input type="date" value={filters.dateRange.start} onChange={(e) => handleDateRangeChange('start', e.target.value)} className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span className="text-gray-500">to</span>
                <input type="date" value={filters.dateRange.end} onChange={(e) => handleDateRangeChange('end', e.target.value)} className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
        </div>

        {/* Users Filter Section */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Assigned Users</label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                addUser(e.target.value);
                e.target.value = ''; // Reset dropdown
              }
            }}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select users...</option>
            {availableUsers.map(user => (
              <option key={user._id} value={user._id}>
                {user.first_name} {user.last_name}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-1 min-h-[24px]">
            {filters.userIds.map(userId => {
              const user = availableUsers.find(u => u._id === userId);
              return (
                <span key={userId} className="inline-flex items-center px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
                  <button type="button" onClick={() => removeUser(userId)} className="ml-1.5 text-blue-500 hover:text-blue-700">✕</button>
                </span>
              );
            })}
          </div>
        </div>

        {/* Resources Filter Section */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Resources</label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                addResource(e.target.value);
                e.target.value = '';
              }
            }}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select resources...</option>
            {availableResources.map(resource => (
              <option key={resource._id} value={resource._id}>
                {resource.displayName}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-1 min-h-[24px]">
            {filters.resourceIds.map(resourceId => {
              const resource = availableResources.find(r => r._id === resourceId);
              return (
                <span key={resourceId} className="inline-flex items-center px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                  {resource ? resource.displayName : 'Loading...'}
                  <button type="button" onClick={() => removeResource(resourceId)} className="ml-1.5 text-green-500 hover:text-green-700">✕</button>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;