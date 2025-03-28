import React, { useState,useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaPlus } from 'react-icons/fa';
import { setTaskView } from '../features/taskSlice';
import { FiList, FiCheckCircle, FiArchive, FiClipboard, FiTool, FiUsers, FiUserPlus, FiSettings, FiPackage } from "react-icons/fi";
import { FaUser } from "react-icons/fa";
import DateRangeFilter from "../Components/taskComponents/datePicker";
import "react-datepicker/dist/react-datepicker.css";
import { AiOutlineHome } from "react-icons/ai";
import { fetchResourceTypes } from '../features/resourceTypeSlice';

const Sidebar = ({ handleEventCreate, onDateRangeSelect, onCalendarDateChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Access logged-in user's data from Redux store
    const { access_level } = useSelector((state) => state.auth.user) || 1;
  const { resourceTypes } = useSelector((state) => state.resourceTypes);
   
  useEffect(() => {
    if (access_level >= 3) { // Only fetch if user has permission
      dispatch(fetchResourceTypes());
    }
  }, [dispatch, access_level]);
  // Define the icon rendering function inside the component
  const renderDynamicIcon = (iconName) => {
    const iconComponents = {
      wrench: <FiTool size={16} />,
      FiTool: <FiTool size={16} />,
      settings: <FiSettings size={16} />,
      package: <FiPackage size={16} />,
      // Add more icon mappings as needed
    };
    
    return iconComponents[iconName] || 
      <span className="text-sm">{iconName}</span>; // Fallback for unknown icons
  };
  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleNavigation = (path) => {
    navigate(path);
    toggleSidebar();
  };

  const handleHomeClick = () => {
    dispatch(setTaskView('allTasks'));
    navigate('/home');
    setIsOpen(false);
  };

  const handleViewYourTasksClick = () => {
    dispatch(setTaskView('userTasks'));
    navigate('/home');
    setIsOpen(false);
  };

  const handleViewYourDoneTasksClick = () => {
    dispatch(setTaskView('userDoneTasks'));
    navigate('/home');
    setIsOpen(false);
  };

  const handleViewAllDoneTasksClick = () => {
    dispatch(setTaskView('allDoneTasks'));
    navigate('/home');
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="lg:hidden fixed top-3 left-4 z-50 text-2xl text-gray-800"
        onClick={toggleSidebar}
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>
  
      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 h-screen w-[265px] bg-gray-50 border-r border-gray-300 shadow-lg transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:mt-16 transition-transform duration-300 ease-in-out z-40 flex flex-col`}
      >
        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 pl-4 pr-1 flex flex-col">
          {/* Date Picker */}
          <div className="mt-3">
            <DateRangeFilter
              onDateRangeSelect={onDateRangeSelect}
              onCalendarDateChange={onCalendarDateChange}
            />
          </div>
  
          {/* Navigation Buttons */}
          <div className="space-y-2 mt-4">
            <button
              className="w-full flex text-left text-gray-800 bg-blue-100 px-4 py-3 rounded-md hover:bg-blue-200 transition"
              onClick={handleHomeClick}
            >
              <AiOutlineHome className="text-blue-500 mr-3" size={24} />
              Home
            </button>
  
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
  
            {access_level >= 3 && (
              <button
                className="w-full flex items-center text-gray-800 bg-blue-100 px-4 py-3 rounded-md hover:bg-blue-200 transition"
                onClick={() => handleNavigation('/filter-tasks')}
              >
                <FiClipboard className="text-blue-500 mr-3" size={24} />
                Filter and Report
              </button>
            )}
  
            {access_level >= 4 && (
              <button
                className="w-full flex items-center text-gray-800 bg-blue-100 px-4 py-3 rounded-md hover:bg-blue-200 transition"
                onClick={() => handleNavigation('/user')}
              >
                <FaUser className="text-blue-500 mr-3" size={24} />
                User List
              </button>
            )}
  
            <button
              className="w-full flex text-left text-gray-800 bg-blue-100 px-4 py-3 rounded-md hover:bg-blue-200 transition"
              onClick={handleViewAllDoneTasksClick}
            >
              <FiArchive className="text-blue-500 mr-3" size={24} />
              Tasks History
            </button>
          </div>
  
          {/* Resource Types Section */}
          {access_level >= 3 && resourceTypes?.length > 0 && (
            <div className="mt-4 flex-1 min-h-0">
              <h3 className="px-4 py-2 text-sm font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10">
                Resource Types
              </h3>
              <div className="overflow-y-auto max-h-[200px]">
                <div className="space-y-1 pr-2">
                  {resourceTypes.map((type) => (
                    <button
                      key={type._id}
                      onClick={() => navigate(`/resource-types/${type._id}`)}
                      className="w-full flex items-center text-left hover:bg-gray-100 px-4 py-2 rounded-md transition-colors duration-200"
                      style={{ color: type.color || '#3b82f6' }}
                    >
                      {type.icon && (
                        <span className="mr-3 flex-shrink-0" style={{ color: type.color }}>
                          {renderDynamicIcon(type.icon)}
                        </span>
                      )}
                      <span className="truncate flex-1 min-w-0">{type.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
  
        {/* Add Button (Sticky Bottom) */}
        {access_level >= 4 && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 pt-2 pb-4">
            <div 
              className="relative flex justify-end pr-4"
              onMouseEnter={() => setShowAddOptions(true)}
              onMouseLeave={() => setShowAddOptions(false)}
            >
              <div className="relative">
                <button 
                  className="bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-110"
                  aria-label="Add options"
                >
                  <FaPlus size={18} />
                </button>
  
                <div className={`absolute bottom-full right-0 mb-2 flex flex-col space-y-1 transition-all duration-300 ${
                  showAddOptions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                }`}>
                  <button 
                    className="bg-blue-400 text-white p-2 rounded-full shadow-md hover:bg-blue-500 transition-transform duration-200 transform hover:-translate-y-1 flex items-center justify-center"
                    onClick={() => {
                      handleNavigation('/add-team');
                      setShowAddOptions(false);
                    }}
                    aria-label="Add team"
                  >
                    <FiUsers size={16} />
                  </button>
                  <button 
                    className="bg-blue-400 text-white p-2 rounded-full shadow-md hover:bg-blue-500 transition-transform duration-200 transform hover:-translate-y-1 flex items-center justify-center"
                    onClick={() => {
                      handleNavigation('/create-resource-type');
                      setShowAddOptions(false);
                    }}
                    aria-label="Add resource"
                  >
                    <FiTool size={16} />
                  </button>
                  <button 
                    className="bg-blue-400 text-white p-2 rounded-full shadow-md hover:bg-blue-500 transition-transform duration-200 transform hover:-translate-y-1 flex items-center justify-center"
                    onClick={() => {
                      handleNavigation('/add-user');
                      setShowAddOptions(false);
                    }}
                    aria-label="Add user"
                  >
                    <FiUserPlus size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
  
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
};

export default Sidebar;