
import React, { useState } from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const DateRangeFilter = ({ onDateRangeSelect, onCalendarDateChange }) => {
  const [dateRange, setDateRange] = useState([null, null]); // Store selected range
  const [startDate, endDate] = dateRange;

  const handleDateRangeChange = (update) => {
    setDateRange(update); // Update selected range

    if (update[0] && update[1]) {
      // Trigger the callback when both dates are selected
      onDateRangeSelect(update[0], update[1]);

      // Update the calendar to reflect the filtered range
      onCalendarDateChange(update[0], update[1]);
    } else if (!update[0] && !update[1]) {
      // Trigger callback with nulls when date range is cleared
      onDateRangeSelect(null, null);
      onCalendarDateChange(null, null); // Clear calendar view as well
    }
  };

  return (
   <div className="mb-9 date-range-filter relative">
   <ReactDatePicker
     selectsRange
     startDate={startDate}
     endDate={endDate}
     onChange={handleDateRangeChange}
     isClearable={true} // Allow clearing the selected range
     placeholderText="Select a date range"
     popperPlacement="bottom-start" // Ensure the popper is placed below
     popperContainer={({ children }) => (
       <div className="z-[9999] absolute">{children}</div> // Ensure popper is above other elements
     )}
     className="input p-1 border border-blue-900 rounded-md "
   />
 </div>
 
  );
};

export default DateRangeFilter;
