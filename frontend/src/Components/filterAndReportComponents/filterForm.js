import React, { useState } from "react";
import { SelectInput } from "../taskComponents/selectInput";

const FilterForm = ({ onFilter, onReset, users, facilities, machines, tools, materials }) => {
  const [filters, setFilters] = useState({
    assignedTo: [],
    startDate: "",
    endDate: "",
    facility: null,
    status: "",
    machine: null,
    tools: [],
    materials: [],
    taskPeriod: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log("name, value",name, value);
    setFilters((prev) => ({
      ...prev,
      [name]: Array.isArray(value) ? [...value] : value, // Ensure arrays are stored properly
    }));
  };
  // Handle date inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    onFilter(filters);
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      assignedTo: [],
      startDate: "",
      endDate: "",
      facility: null,
      status: "",
      machine: null,
      tools: [],
      materials: [],
      taskPeriod: "",
    });
    onReset();
  };

  return (
    <div className="mb-4 p-4 border rounded-lg shadow-md bg-white">
      <h2 className="text-lg font-semibold max-w-4xl mb-4">Filter Tasks</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Assigned To (Multi-Select) */}
        <SelectInput
          label="Assigned To"
          name="assignedTo"
          value={filters.assignedTo}
          onChange={handleChange}
          options={Array.isArray(users) ? users.map(user => ({
            label: `${user.first_name} ${user.last_name} `,
            value: user._id,
          })) : []}
          isMulti
        />

        {/* Date Range */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-600">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleInputChange}
            className="p-2 border rounded w-full"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-600">End Date</label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleInputChange}
            className="p-2 border rounded w-full"
          />
        </div>

        {/* Facility (Single Select) */}
        <SelectInput
          label="Facility"
          name="facility"
          value={filters.facility}
          onChange={handleChange}
          options={Array.isArray(facilities) ? facilities.map((facility) => ({
            label: facility.facility_name,
            value: facility._id,
          })) : []}      
            />

        {/* Machine (Single Select) */}
        <SelectInput
          label="Machine"
          name="machine"
          value={filters.machine}
          onChange={handleChange}
          options={Array.isArray(machines) ? machines.map((machine) => ({
            label: machine.machine_name,
            value: machine._id,
          })) : []}       
           />
 
        {/* Tools (Multi-Select) */}
        <SelectInput
          label="Tools"
          name="tools"
          value={filters.tools}
          onChange={handleChange}
          options={Array.isArray(tools) ? tools.map(tool => ({
            label: tool.tool_name,
            value: tool._id,
          })) : []}  
                  isMulti
        />

        {/* Materials (Multi-Select) */}
        <SelectInput
          label="Materials"
          name="materials"
          value={filters.materials}
          onChange={handleChange}
          options={Array.isArray(materials) ? materials.map(material => ({
            label: material.material_name,
            value: material._id,
          })) : []}  
         isMulti
        />

        {/* Status */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-600">Status</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleInputChange}
            className="p-2 border rounded w-full"
          >
            <option value="">All</option>
            <option value="in progress">In Progress</option>
            <option value="done">Done</option>
            <option value="pending">Pending</option>
            <option value="impossible">Impossible</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-4 ml-2 flex space-x-4">
        <button onClick={handleApplyFilters} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Search
        </button>
        <button onClick={handleResetFilters} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
          Reset
        </button>
      </div>
    </div>
  );
};

export default FilterForm;