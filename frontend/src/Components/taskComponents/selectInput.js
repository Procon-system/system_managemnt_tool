
import Select from 'react-select';
import React, { useState } from 'react';
// const SelectInput = ({ label, name, value = "", onChange, options, required = false, isMulti = false }) => {
//     // Convert the selected value into a compatible format for `react-select`
//     const selectedOption = isMulti 
//         ? options.filter(option => value.includes(option.value))
//         : options.find(option => option.value === value);

//     const handleSelectChange = (selectedOption) => {
//         // Handle single or multi-selection based on `isMulti`
//         const newValue = isMulti
//             ? selectedOption.map(option => option.value) // for multi-selection
//             : selectedOption ? selectedOption.value : ""; // for single-selection
//         onChange({ target: { name, value: newValue } });
//     };

//     return (
//     <div className="mb-4 w-full px-2">
//     <label className="block mb-1 text-sm font-medium text-gray-600">{label}</label>
//     <Select
//         name={name}
//         value={selectedOption}
//         onChange={handleSelectChange}
//         options={options}
//         isClearable
//         placeholder={`Select ${label}`}
//         isSearchable
//         isMulti={isMulti}
//         className="w-full"
//         styles={{
//             control: (base) => ({ ...base, backgroundColor: 'rgb(249 250 251)', padding: '4px 8px', borderColor: 'rgb(209 213 219)' }),
//             placeholder: (base) => ({ ...base, color: 'rgb(107 114 128)' }),
//         }}
//     />
// </div>
//     );
// };
// const SelectInput = ({ label, name, value = "", onChange, options, required = false, isMulti = false }) => {
//   // Ensure selected values match option values (IDs only)
//   const selectedOption = isMulti
//       ? options.filter(option => Array.isArray(value) && value.includes(option.value))
//       : options.find(option => option.value === value);

//   const handleSelectChange = (selectedOption) => {
//       const newValue = isMulti
//           ? (selectedOption ? selectedOption.map(option => option.value) : []) // Extract array of IDs
//           : (selectedOption ? selectedOption.value : ""); // Single selection returns a string or empty

//       onChange({ target: { name, value: newValue } });
//   };

//   return (
//       <div className="mb-4 w-full px-2">
//           <label className="block mb-1 text-sm font-medium text-gray-600">{label}</label>
//           <Select
//               name={name}
//               value={selectedOption}
//               onChange={handleSelectChange}
//               options={options}
//               isClearable
//               placeholder={`Select ${label}`}
//               isSearchable
//               isMulti={isMulti}
//               className="w-full"
//               styles={{
//                   control: (base) => ({ ...base, backgroundColor: 'rgb(249 250 251)', padding: '4px 8px', borderColor: 'rgb(209 213 219)' }),
//                   placeholder: (base) => ({ ...base, color: 'rgb(107 114 128)' }),
//               }}
//           />
//       </div>
//   );
// };
// const getSelectedOptions = (items, options) => {
//   return items.map(item => {
//     // Find the option by ID (_id), assuming item is an object containing _id
//     const option = options.find(option => option.value === item); 
//     return option ? option : null; // Return the matched option or null if not found
//   }).filter(option => option !== null); // Filter out nulls
// };
const getSelectedOptions = (items, options) => {
  console.log("items, options",items, options)
  if (!items || items.length === 0) return []; // Handle undefined/null/empty cases

  return items.map(item => {
    const id = typeof item === "object" ? item._id || item.id : item; // Extract ID if it's an object
    return options.find(option => option.value === id) || null; // Find option in dropdown options
  }).filter(option => option !== null); // Remove nulls
};


const SelectInput = ({ label, name, value = [], onChange, options, isMulti = false }) => {
  // Ensure multi-select displays selected values correctly
  const selectedOption = isMulti 
    ? getSelectedOptions(value, options) // Convert IDs to full objects
    : options.find(option => option.value === value) || null; // Handle single select

  console.log("Rendering SelectInput:", name, selectedOption);

  const handleSelectChange = (selectedOption) => {
    const newValue = isMulti
      ? selectedOption.map(option => option.value) // Convert objects to an array of IDs
      : selectedOption ? selectedOption.value : ""; // Convert single select to a single ID

    console.log("New Selection:", name, newValue);

    onChange({ target: { name, value: newValue } });
  };

  return (
    <div className="mb-4 w-full px-2">
      <label className="block mb-1 text-sm font-medium text-gray-600">{label}</label>
      <Select
        name={name}
        value={selectedOption} // Ensure selected value is mapped correctly
        onChange={handleSelectChange}
        options={options}
        isClearable
        placeholder={`Select ${label}`}
        isSearchable
        isMulti={isMulti}
        className="w-full"
        styles={{
          control: (base) => ({
            ...base,
            backgroundColor: 'rgb(249 250 251)',
            padding: '4px 8px',
            borderColor: 'rgb(209 213 219)'
          }),
          placeholder: (base) => ({ ...base, color: 'rgb(107 114 128)' }),
        }}
      />
    </div>
  );
};

// Options for time period (days, weeks, months, years)
const periodOptions = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
  ];
  
  // Validation function for task period
  const validateTaskPeriod = (number, period) => {
    if (!number || isNaN(number) || number <= 0) {
      return { valid: false, error: "Please enter a valid number." };
    }
  
    if (!period) {
      return { valid: false, error: "Please select a time period (day, week, month, year)." };
    }
  
    return { valid: true };
  };
  
  const SelectTaskPeriodInput = ({ label, name, value = "", onChange, required = false }) => {
    const [numberValue, setNumberValue] = useState(value ? value.split(' ')[0] : ''); // Extract number from string
    const [periodValue, setPeriodValue] = useState(value ? value.split(' ')[1] : ''); // Extract period from string
    const [error, setError] = useState('');
  
    // Handle changes in the number field
    const handleNumberChange = (e) => {
      const newNumber = e.target.value;
      setNumberValue(newNumber);
  
      const validationResult = validateTaskPeriod(newNumber, periodValue);
      if (validationResult.valid) {
        setError("");
      } else {
        setError(validationResult.error);
      }
  
      // Combine number and period into one string and send
      const combinedValue = `${newNumber} ${periodValue}`;
      onChange({ target: { name, value: combinedValue } });
    };
  
    // Handle changes in the period selector (day, week, month, year)
    const handlePeriodChange = (selectedOption) => {
      const newPeriod = selectedOption ? selectedOption.value : '';
      setPeriodValue(newPeriod);
  
      const validationResult = validateTaskPeriod(numberValue, newPeriod);
      if (validationResult.valid) {
        setError("");
      } else {
        setError(validationResult.error);
      }
  
      // Combine number and period into one string and send
      const combinedValue = `${numberValue} ${newPeriod}`;
      onChange({ target: { name, value: combinedValue } });
    };
  
    return (
        <div className="mb-4 w-full px-2">
          <label className="block mb-1 text-sm font-medium text-gray-600">{label}</label>
          
          {/* Flex container to hold both inputs horizontally */}
          <div className="flex items-center space-x-1">
            {/* Number Input for task period */}
            <input
              type="number"
              value={numberValue}
              onChange={handleNumberChange}
              placeholder="time"
              className="md:w-1/3 w-1/2 py-2 px-2 border border-gray-300 rounded"
            />
      
            {/* Select Input for period (day, week, month, year) */}
            <Select
              name={`${name}-period`}
              value={periodValue ? periodOptions.find(option => option.value === periodValue) : null}
              onChange={handlePeriodChange}
              options={periodOptions}
              isClearable
              placeholder="period"
              className="md:w-2/3 w-1/2"  // Adjust the width proportionally
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: 'rgb(249 250 251)',
                  padding: '2px 2px',
                  borderColor: 'rgb(209 213 219)',
                }),
                placeholder: (base) => ({ ...base, color: 'rgb(107 114 128)' }),
              }}
            />
          </div>
      
          {/* Display error message if the input is invalid */}
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      );
      
  };
  

export { SelectTaskPeriodInput,getSelectedOptions, SelectInput };
