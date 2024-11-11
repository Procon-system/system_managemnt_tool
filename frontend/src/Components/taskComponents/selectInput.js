
// import React from 'react';

// const SelectInput = ({ label, name, value, onChange, options, required = false }) => (
//     <div className="mb-4 w-full sm:w-1/2 md:w-3/4 px-2">
//         <label className="block mb-1 text-sm font-medium text-gray-600">{label}</label>
//         <select
//             name={name}
//             value={value}
//             onChange={onChange}
//             required={required}
//             className="w-full bg-gray-50 px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
//         >
//             {options.map((option) => (
//                 <option key={option.value} value={option.value}>
//                     {option.label}
//                 </option>
//             ))}
//         </select>
//     </div>
// );

// export default SelectInput;
import React from 'react';

const SelectInput = ({ label, name, value = "", onChange, options, required = false }) => (
    <div className="mb-4 w-full sm:w-1/2 md:w-3/4 px-2">
        <label className="block mb-1 text-sm font-medium text-gray-600">{label}</label>
        <select
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            className="w-full bg-gray-50 px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
        >
            <option value="" disabled>
                Select {label}
            </option>
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    </div>
);

export default SelectInput;
