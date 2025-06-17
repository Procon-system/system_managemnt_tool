// import React, { useState } from 'react';
// import ReactDatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';

// const DateRangeFilter = ({ onDateRangeSelect, onCalendarDateChange }) => {
//   const [dateRange, setDateRange] = useState([null, null]); // Store selected range
//   const [startDate, endDate] = dateRange;

//   const handleDateRangeChange = (update) => {
//     setDateRange(update); // Update selected range

//     if (update[0] && update[1]) {
//       onDateRangeSelect(update[0], update[1]);
//       onCalendarDateChange(update[0], update[1]);
//     } else if (!update[0] && !update[1]) {
//       onDateRangeSelect(null, null);
//       onCalendarDateChange(null, null);
//     }
//   };

//   const clearDateRange = () => {
//     setDateRange([null, null]); // Clear selected range
//     onDateRangeSelect(null, null); // Trigger callback with null values
//     onCalendarDateChange(null, null);
//   };

//   return (
//     <div className="date-range-filter relative">
//       <ReactDatePicker
//         selectsRange
//         startDate={startDate}
//         endDate={endDate}
//         onChange={handleDateRangeChange}
//         inline
//         renderCustomHeader={({ date, decreaseMonth, increaseMonth }) => (
//           <div className="flex items-center justify-between mb-2 px-2">
//             {/* Navigation Buttons */}
//             <button onClick={decreaseMonth} className="text-blue-500 font-bold hover:underline">
//               {'<'}
//             </button>
//             <span className=" text-md font-semibold">
//               {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
//             </span>
//             <button onClick={increaseMonth} className="text-blue-500 font-bold hover:underline">
//               {'>'}
//             </button>

//             {/* Clear Dates (Integrated into Header) */}
//             {(startDate || endDate) && (
//               <button
//                 onClick={clearDateRange}
//                 className="text-white px-2 py-1 bg-red-500 rounded-md hover:bg-red-600 transition ml-1"
//               >
//                 X
//               </button>
//             )}
//           </div>
//         )}
//         placeholderText="Select a date range"
//         className="input p-1 border border-blue-900 rounded-md"
//       />
//     </div>
//   );
// };

// export default DateRangeFilter;
// src/Components/DateRangeFilter.jsx

import React, { useState, useMemo } from 'react'; // <-- Import useMemo
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './datePicker.css'; // <-- We'll create this file for our custom dot styles

const DateRangeFilter = ({ onDateRangeSelect, onCalendarDateChange, tasksWithDates = [] }) => {
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  // 2. Calculate highlighted dates using useMemo for performance
  const highlightedDates = useMemo(() => {
    if (!tasksWithDates || tasksWithDates.length === 0) {
      return [];
    }

    // Use a Set to store unique dates to avoid duplicates
    console.log("taskwithdates",tasksWithDates);
    const dateSet = new Set();
    tasksWithDates.forEach((task) => {
      // IMPORTANT: Use the correct date property from your task object.
      // It could be 'start', 'startDate', 'dueDate', etc.
      // I'll assume it's 'start' based on typical calendar events.
      if (task.start) {
        // Normalize the date to midnight to ensure correct comparison
        const taskDate = new Date(task.start);
        taskDate.setHours(0, 0, 0, 0);
        dateSet.add(taskDate.getTime()); // Add the timestamp to the set
      }
    });

    // Convert the set of timestamps back to an array of Date objects
    return Array.from(dateSet).map(time => new Date(time));
  }, [tasksWithDates]); // This will only re-run when tasksWithDates changes

  const handleDateRangeChange = (update) => {
    setDateRange(update);

    if (update[0] && update[1]) {
      onDateRangeSelect(update[0], update[1]);
      onCalendarDateChange(update[0], update[1]);
    } else if (!update[0] && !update[1]) {
      onDateRangeSelect(null, null);
      onCalendarDateChange(null, null);
    }
  };

  const clearDateRange = () => {
    setDateRange([null, null]);
    onDateRangeSelect(null, null);
    onCalendarDateChange(null, null);
  };

  return (
    <div className="date-range-filter relative">
      <ReactDatePicker
        selectsRange
        startDate={startDate}
        endDate={endDate}
        onChange={handleDateRangeChange}
        highlightDates={highlightedDates} // <-- 3. APPLY THE HIGHLIGHTED DATES
        inline
        renderCustomHeader={({ date, decreaseMonth, increaseMonth }) => (
          <div className="flex items-center justify-between mb-2 px-2">
            <button onClick={decreaseMonth} className="text-blue-500 font-bold hover:underline">
              {'<'}
            </button>
            <span className=" text-md font-semibold">
              {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={increaseMonth} className="text-blue-500 font-bold hover:underline">
              {'>'}
            </button>
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