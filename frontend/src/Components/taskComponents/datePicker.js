import React, { useState } from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const DateRangeFilter = ({ onDateRangeSelect, onCalendarDateChange }) => {
  const [dateRange, setDateRange] = useState([null, null]); // Store selected range
  const [startDate, endDate] = dateRange;

  const handleDateRangeChange = (update) => {
    setDateRange(update); // Update selected range

    if (update[0] && update[1]) {
      onDateRangeSelect(update[0], update[1]);
      onCalendarDateChange(update[0], update[1]);
    } else if (!update[0] && !update[1]) {
      onDateRangeSelect(null, null);
      onCalendarDateChange(null, null);
    }
  };

  const clearDateRange = () => {
    setDateRange([null, null]); // Clear selected range
    onDateRangeSelect(null, null); // Trigger callback with null values
    onCalendarDateChange(null, null);
  };

  return (
    <div className="date-range-filter relative">
      <ReactDatePicker
        selectsRange
        startDate={startDate}
        endDate={endDate}
        onChange={handleDateRangeChange}
        inline
        renderCustomHeader={({ date, decreaseMonth, increaseMonth }) => (
          <div className="flex items-center justify-between mb-2 px-2">
            {/* Navigation Buttons */}
            <button onClick={decreaseMonth} className="text-blue-500 font-bold hover:underline">
              {'<'}
            </button>
            <span className=" text-md font-semibold">
              {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={increaseMonth} className="text-blue-500 font-bold hover:underline">
              {'>'}
            </button>

            {/* Clear Dates (Integrated into Header) */}
            {(startDate || endDate) && (
              <button
                onClick={clearDateRange}
                className="text-white px-2 py-1 bg-red-500 rounded-md hover:bg-red-600 transition ml-1"
              >
                X
              </button>
            )}
          </div>
        )}
        placeholderText="Select a date range"
        className="input p-1 border border-blue-900 rounded-md"
      />
    </div>
  );
};

export default DateRangeFilter;
