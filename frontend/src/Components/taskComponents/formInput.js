
import React from 'react';

const FormInput = ({ label, name, type = 'text', value, onChange, required = false }) => (
    <div className="mb-4">
        <label className="block mb-1 text-sm font-medium text-gray-600">{label}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
        />
    </div>
);

export default FormInput;
