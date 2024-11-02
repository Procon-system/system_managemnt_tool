// src/components/SelectInput.js
import React from 'react';

const SelectInput = ({ label, name, value, onChange, options, required = false }) => (
    <div className="mb-4">
        <label className="block mb-1 text-sm font-medium text-gray-600">{label}</label>
        <select
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    </div>
);

export default SelectInput;
