
import React, { useState } from 'react';
import { FiFilter, FiSearch, FiCalendar } from 'react-icons/fi';

const FilterPanel = ({
    filters,
    onApplyFilters,
    availableUsers = [],
    availableResources = [],
}) => {
    const [userSearch, setUserSearch] = useState('');
    const [resourceSearch, setResourceSearch] = useState('');

    const handleDateRangeChange = (field, value) => {
        onApplyFilters({ dateRange: { ...filters.dateRange, [field]: value } });
    };

    const setQuickDateRange = (range) => {
        const end = new Date();
        const start = new Date();
        if (range === 'last7') start.setDate(end.getDate() - 7);
        if (range === 'thisMonth') start.setDate(1);
        onApplyFilters({ dateRange: { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] } });
    };

    const addUser = (userId) => {
        if (userId && !filters.userIds.includes(userId)) {
            onApplyFilters({ userIds: [...filters.userIds, userId] });
            setUserSearch('');
        }
    };
    const removeUser = (userId) => {
        onApplyFilters({ userIds: filters.userIds.filter(id => id !== userId) });
    };

    const addResource = (resourceId) => {
        if (resourceId && !filters.resourceIds.includes(resourceId)) {
            onApplyFilters({ resourceIds: [...filters.resourceIds, resourceId] });
            setResourceSearch('');
        }
    };
    const removeResource = (resourceId) => {
        onApplyFilters({ resourceIds: filters.resourceIds.filter(id => id !== resourceId) });
    };

    const filteredUsers = userSearch ? availableUsers.filter(user =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(userSearch.toLowerCase()) && !filters.userIds.includes(user._id)
    ) : [];
    
    const filteredResources = resourceSearch ? availableResources.filter(resource =>
        resource.displayName.toLowerCase().includes(resourceSearch.toLowerCase()) && !filters.resourceIds.includes(resource._id)
    ) : [];

    return (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow mb-6">
            <div className="flex items-center gap-3 mb-4">
                <FiFilter className="h-6 w-6 text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-800">Filters</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Date Range Section */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2"><FiCalendar/> Date Range</label>
                    <div className="flex gap-2">
                        <input type="date" value={filters.dateRange.start || ''} onChange={(e) => handleDateRangeChange('start', e.target.value)} className="w-full px-3 py-1.5 text-sm border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <span className="text-gray-500 flex items-center">-</span>
                        <input type="date" value={filters.dateRange.end || ''} onChange={(e) => handleDateRangeChange('end', e.target.value)} className="w-full px-3 py-1.5 text-sm border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="flex gap-2 text-xs">
                        <button onClick={() => setQuickDateRange('last7')} className="text-blue-600 hover:underline">Last 7 Days</button>
                        <button onClick={() => setQuickDateRange('thisMonth')} className="text-blue-600 hover:underline">This Month</button>
                    </div>
                </div>

                {/* Users Filter Section */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Filter by User</label>
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input type="text" placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="w-full pl-10 pr-4 py-1.5 text-sm border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        {userSearch && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                {filteredUsers.length > 0 ? filteredUsers.map(user => (
                                    <div key={user._id} onClick={() => addUser(user._id)} className="px-4 py-2 text-sm cursor-pointer hover:bg-blue-50">{user.first_name} {user.last_name}</div>
                                )) : <div className="px-4 py-2 text-sm text-gray-500">No matching users found.</div>}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1 min-h-[30px]">
                        {filters.userIds.map(userId => {
                            const user = availableUsers.find(u => u._id === userId);
                            return user ? <span key={userId} className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-semibold">{user.first_name} {user.last_name} <button onClick={() => removeUser(userId)} className="ml-1.5 font-bold text-blue-500 hover:text-blue-700">×</button></span> : null;
                        })}
                    </div>
                </div>

                {/* Resources Filter Section */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Filter by Resource</label>
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input type="text" placeholder="Search resources..." value={resourceSearch} onChange={(e) => setResourceSearch(e.target.value)} className="w-full pl-10 pr-4 py-1.5 text-sm border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        {resourceSearch && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                {filteredResources.length > 0 ? filteredResources.map(resource => (
                                    <div key={resource._id} onClick={() => addResource(resource._id)} className="px-4 py-2 text-sm cursor-pointer hover:bg-green-50">{resource.displayName}</div>
                                )) : <div className="px-4 py-2 text-sm text-gray-500">No matching resources found.</div>}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1 min-h-[30px]">
                        {filters.resourceIds.map(resourceId => {
                            const resource = availableResources.find(r => r._id === resourceId);
                            return resource ? <span key={resourceId} className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-semibold">{resource.displayName} <button onClick={() => removeResource(resourceId)} className="ml-1.5 font-bold text-green-500 hover:text-green-700">×</button></span> : null;
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterPanel;