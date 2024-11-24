
import React from 'react';

const FormInput = ({ label, name, type = 'text', value, onChange, required = false }) => (
    // <div className="mb-4 w-full md:w-3/4 px-2">
    //     <label className="block mb-1 text-sm font-medium text-gray-600">{label}</label>
    //     <input
    //         type={type}
    //         name={name}
    //         value={value}
    //         onChange={onChange}
    //         required={required}
    //         className="w-full bg-gray-50 px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
    //     />
    // </div>
    <div className="mb-4 w-full md:w-1/2 lg:w-1/3 px-2">
    <label className="block mb-1 text-sm font-medium text-gray-600">{label}</label>
    <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-gray-50 px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
    />
</div>
);

export default FormInput;
