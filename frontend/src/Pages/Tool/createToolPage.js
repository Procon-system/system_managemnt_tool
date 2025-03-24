import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchTools, 
  createTool, 
  deleteTool, 
  updateTool, 
  addToolFromSocket, 
  updateToolFromSocket, 
  removeToolFromSocket 
} from '../../features/toolsSlice';
import ToolForm from '../../Components/toolsComponents/toolForm';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import SearchBar from '../../Components/common/SearchBar';
import Pagination from '../../Components/common/Pagination';
import useSearchAndPagination from '../../hooks/useSearchAndPagination';
import { toast } from 'react-toastify';
import { io } from "socket.io-client";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL

const socket = io(API_BASE_URL );

const CreateToolPage = () => {
  const dispatch = useDispatch();
  const tools = useSelector((state) => state.tools.tools || []);
  const [showForm, setShowForm] = useState(false);
  const [editingTool, setEditingTool] = useState(null);

  // Initialize search and pagination
  const {
    searchTerm,
    currentPage,
    currentItems: currentTools,
    totalPages,
    handleSearchChange,
    handlePageChange,
    totalItems
  } = useSearchAndPagination(tools, 7, ['tool_name', 'certification']);

  useEffect(() => {
    dispatch(fetchTools());

    socket.on("toolCreated", (data) => {
      if (data.newTool) {
        dispatch(addToolFromSocket(data.newTool));
        toast.success("New tool added!");
      }
    });

    socket.on("toolUpdated", (updatedTool) => {
      dispatch(updateToolFromSocket(updatedTool));
      toast.success("Tool updated successfully!");
    });

    socket.on("toolDeleted", (toolId) => {
      dispatch(removeToolFromSocket(toolId));
      toast.success("Tool deleted successfully!");
    });

    return () => {
      socket.off("toolCreated");
      socket.off("toolUpdated");
      socket.off("toolDeleted");
    };
  }, [dispatch]);

  const handleAddClick = () => {
    setEditingTool(null);
    setShowForm(true);
  };

  const handleEditClick = (tool) => {
    setEditingTool(tool);
    setShowForm(true);
  };

  const handleDeleteClick = async (toolId) => {
    try {
      await dispatch(deleteTool(toolId)).unwrap();
      // Let socket handle the state update
    } catch (error) {
      toast.error("Failed to delete tool");
    }
  };

  const handleFormSubmit = async (toolData) => {
    try {
      if (editingTool) {
        await dispatch(updateTool({ 
          toolId: editingTool._id, 
          updatedData: { ...toolData } 
        })).unwrap();
      } else {
        await dispatch(createTool(toolData)).unwrap();
      }
      setShowForm(false);
      setEditingTool(null);
      // Let socket handle the state update
    } catch (error) {
      console.error("Failed to submit form:", error);
      toast.error("Failed to save tool");
    }
  };

  return (
    <div className="container mx-auto p-4 md:mx-2 lg:ml-72">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-2 md:space-y-0">
        <h2 className="text-xl sm:text-2xl border p-1 rounded-md bg-blue-100 font-bold">Tools</h2>
        
        <SearchBar 
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          placeholder="Search tools..."
        />

        <button
          onClick={handleAddClick}
          className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition flex items-center space-x-2"
        >
          <FaPlus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Add Tool</span>
        </button>
      </div>

      {/* Tools List */}
      <div className="space-y-4">
        {Array.isArray(currentTools) && currentTools.length > 0 ? (
          currentTools.map((tool) => (
            tool && tool._id ? (
              <div
                key={tool._id}
                className="p-4 border rounded shadow flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0"
              >
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold">{tool.tool_name}</h3>
                  <p className="text-gray-600">Available Since: {tool.available_since}</p>
                  <p className="text-gray-600">Certification: {tool.certification}</p>
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => handleEditClick(tool)} 
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <FaEdit className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(tool._id)} 
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrash className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : null
          ))
        ) : (
          <p className="text-gray-600">No tools available</p>
        )}
      </div>

      {/* Pagination */}
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemsPerPage={7}
        totalItems={totalItems}
      />

      {/* Tool Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
              onClick={() => {
                setShowForm(false);
                setEditingTool(null);
              }}
            >
              ×
            </button>
            <ToolForm
              onSubmit={handleFormSubmit}
              tool={editingTool}
              onClose={() => {
                setShowForm(false);
                setEditingTool(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateToolPage;
