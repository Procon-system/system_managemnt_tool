
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTools, createTool, deleteTool, updateTool } from '../../features/toolsSlice';
import ToolForm from '../../Components/toolsComponents/toolForm';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

const CreateToolPage = () => {
  const dispatch = useDispatch();
  const tools = useSelector((state) => state.tools.tools || []);
  const [showForm, setShowForm] = useState(false);
  const [editingTool, setEditingTool] = useState(null);

  useEffect(() => {
    dispatch(fetchTools());
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
    await dispatch(deleteTool(toolId));
  };

  const handleFormSubmit = async (toolData) => {
    try {
      console.log("data",toolData);
      if (editingTool) {
        await dispatch(updateTool({ toolId: editingTool._id, updatedData: { ...toolData } })).unwrap();
      } else {
        await dispatch(createTool(toolData)).unwrap();
      }
      setShowForm(false);
    } catch (error) {
      console.error("Failed to submit form:", error);
    }
  };

  return (
    <div className="container mx-auto p-4 md:mx-96 lg:ml-72">
      <div className="flex md:flex-row justify-between items-center mb-4 space-y-2 md:space-y-0">
        <h2 className="text-xl sm:text-2xl border p-1 rounded-md bg-blue-100 font-bold">Tools</h2>
        <button
          onClick={handleAddClick}
          className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition flex items-center space-x-2"
        >
          <FaPlus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Add Tool</span>
        </button>
      </div>

      <div className="space-y-4">
        {tools.length > 0 ? (
          tools.map((tool) => (
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
                <button onClick={() => handleEditClick(tool)} className="text-blue-500 hover:text-blue-700">
                  <FaEdit className="w-5 h-5" />
                </button>
                <button onClick={() => handleDeleteClick(tool._id)} className="text-red-500 hover:text-red-700">
                  <FaTrash className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No tools available</p>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowForm(false)}
            >
              &times;
            </button>
            <ToolForm
              onSubmit={handleFormSubmit}
              tool={editingTool}
              onClose={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateToolPage;
