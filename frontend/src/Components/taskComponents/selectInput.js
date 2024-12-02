
import Select from 'react-select';

const SelectInput = ({ label, name, value = "", onChange, options, required = false, isMulti = false }) => {
    // Convert the selected value into a compatible format for `react-select`
    const selectedOption = isMulti 
        ? options.filter(option => value.includes(option.value))
        : options.find(option => option.value === value);

    const handleSelectChange = (selectedOption) => {
        // Handle single or multi-selection based on `isMulti`
        const newValue = isMulti
            ? selectedOption.map(option => option.value) // for multi-selection
            : selectedOption ? selectedOption.value : ""; // for single-selection
        onChange({ target: { name, value: newValue } });
    };

    return (
    <div className="mb-4 w-full md:w-1/2 lg:w-1/3 px-2">
    <label className="block mb-1 text-sm font-medium text-gray-600">{label}</label>
    <Select
        name={name}
        value={selectedOption}
        onChange={handleSelectChange}
        options={options}
        isClearable
        placeholder={`Select ${label}`}
        isSearchable
        isMulti={isMulti}
        className="w-full"
        styles={{
            control: (base) => ({ ...base, backgroundColor: 'rgb(249 250 251)', padding: '4px 8px', borderColor: 'rgb(209 213 219)' }),
            placeholder: (base) => ({ ...base, color: 'rgb(107 114 128)' }),
        }}
    />
</div>
    );
};

export default SelectInput;
