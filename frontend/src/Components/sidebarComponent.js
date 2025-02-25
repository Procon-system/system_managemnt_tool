
import React, { useState } from 'react';
import { useSelector,useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import { setTaskView } from '../features/taskSlice';
import { FiList, FiCheckCircle, FiArchive,FiClipboard, FiHome, FiCpu, FiTool, FiLayers } from "react-icons/fi";
import { FaUser} from "react-icons/fa";
import DateRangeFilter from "../Components/taskComponents/datePicker"; // Import the DateRangeFilter component

import "react-datepicker/dist/react-datepicker.css"; // Import the styles
import { AiOutlineHome } from "react-icons/ai";
const Sidebar = ({ onDateRangeSelect, onCalendarDateChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Access logged-in user's data from Redux store
  const { access_level } = useSelector((state) => state.auth.user)|| 1;

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleNavigation = (path) => {
    navigate(path);
    toggleSidebar();
  };
  const handleHomeClick = () => {
    dispatch(setTaskView('allTasks')); // Update the view
    navigate('/home'); // Navigate to the Home page
    setIsOpen(false); // Close sidebar
  };

  const handleViewYourTasksClick = () => {
      dispatch(setTaskView('userTasks')); // Update the view
      navigate('/home'); // Navigate to the tasks view
      setIsOpen(false); // Close sidebar
  };
  const handleViewYourDoneTasksClick = () => {
    dispatch(setTaskView('userDoneTasks')); // Update the view
    navigate('/home'); // Navigate to the tasks view
    setIsOpen(false); // Close sidebar
   };
  const handleViewAllDoneTasksClick = () => {
   dispatch(setTaskView('allDoneTasks')); // Update the view
   navigate('/home'); // Navigate to the tasks view
   setIsOpen(false); // Close sidebar
  };


  return (
    <>
      {/* Toggle Button for Mobile View */}
      <button
        className="lg:hidden fixed top-3 left-4 z-30 text-2xl text-gray-800"
        onClick={toggleSidebar}
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-[265px] bg-gray-50 border-r border-gray-300 shadow-lg transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:mt-16 transition-transform duration-300 ease-in-out z-20`}
      >
        <div className="flex flex-col space-y-2 py-4 pl-4 pr-1">
           {/* Date Picker Section */}
           <div className="mt-3">
             <DateRangeFilter
              onDateRangeSelect={onDateRangeSelect} // Trigger callback for date range selection
              onCalendarDateChange={onCalendarDateChange} // Update the calendar view
            />
          </div>
          {/* Common Option: Home */}
          <button
            className="w-full flex text-left text-gray-800 bg-blue-100 px-4 py-3 rounded-md hover:bg-blue-200 transition"
            onClick={handleHomeClick}
          >
            <AiOutlineHome className="text-blue-500 mr-3" size={24} />
            Home
          </button>
          

          {/* Access Level 2: Additional Options */}
          {access_level === 2 && (
            <>
              <button
                className="w-full flex text-left text-gray-800 bg-blue-100 px-4 py-3 rounded-md hover:bg-blue-200 transition"
                onClick={handleViewYourTasksClick}
              >
                <FiList className="text-blue-500 mr-3" size={24} />
              Your Tasks
              </button>
              <button
                className="w-full flex text-left text-gray-800 bg-blue-100 px-4 py-3 rounded-md hover:bg-blue-200 transition"
                onClick={handleViewYourDoneTasksClick}
              >
                <FiCheckCircle className="text-blue-500 mr-3" size={24} />
                Your Tasks History
              </button>
            </>
          )}

          {/* Access Level >= 3: Full Options */}
          {access_level >= 3 && (
            <>
            <button
        className="w-full flex items-center text-gray-800 bg-blue-100 px-4 py-3 rounded-md hover:bg-blue-200 transition"
        onClick={() => handleNavigation('/filter-tasks')}
      >
        <FiClipboard className="text-blue-500 mr-3" size={24} />
        Filter and Report
      </button>
              <button
        className="w-full flex items-center text-gray-800 bg-blue-100 px-4 py-3 rounded-md hover:bg-blue-200 transition"
        onClick={() => handleNavigation('/create-task')}
      >
        <FiClipboard className="text-blue-500 mr-3" size={24} />
        Task
      </button>
      
      {/* Facility */}
      <button
        className="w-full flex items-center text-gray-800 bg-blue-100 px-4 py-3 rounded-md hover:bg-blue-200 transition"
        onClick={() => handleNavigation('/create-facility')}
      >
        <FiHome className="text-blue-500 mr-3" size={24} />
        Facility
      </button>

      {/* Machine */}
      <button
        className="w-full flex items-center text-gray-800 bg-blue-100 px-4 py-3 rounded-md hover:bg-blue-200 transition"
        onClick={() => handleNavigation('/create-machines')}
      >
        <FiCpu className="text-blue-500 mr-3" size={24} />
        Machine
      </button>

      {/* Tool */}
      <button
        className="w-full flex items-center text-gray-800 bg-blue-100 px-4 py-3 rounded-md hover:bg-blue-200 transition"
        onClick={() => handleNavigation('/create-tools')}
      >
        <FiTool className="text-blue-500 mr-3" size={24} />
        Tool
      </button>

      {/* Material */}
      <button
        className="w-full flex items-center text-gray-800 bg-blue-100 px-4 py-3 rounded-md hover:bg-blue-200 transition"
        onClick={() => handleNavigation('/create-materials')}
      >
        <FiLayers className="text-blue-500 mr-3" size={24} />
        Material
      </button>
            </>
          )}
          {access_level >=4 && (
            <>
            <button
              className="w-full flex items-center text-gray-800 bg-blue-100 px-4 py-3 rounded-md hover:bg-blue-200 transition"
              onClick={() => handleNavigation('/user')}
            >
                <FaUser className="text-blue-500 mr-3" size={24} />
                User List
              </button></>
          
          )}
          <button
            className="w-full flex text-left text-gray-800 bg-blue-100 px-4 py-3 rounded-md hover:bg-blue-200 transition"
            onClick={handleViewAllDoneTasksClick}
          >
            <FiArchive className="text-blue-500 mr-3" size={24} />
            Tasks History
          </button>
        </div>
      </aside>

      {/* Overlay for Mobile View */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-10 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
