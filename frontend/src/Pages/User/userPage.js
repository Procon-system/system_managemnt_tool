import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUsers, updateUser, deleteUser } from "../../features/userSlice";
import { FaEdit, FaPlus,FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import UserForm from "../../Components/UserComponents/userForm";
import { useNavigate } from "react-router-dom";

const UserManagementPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const users = useSelector((state) => state.users.users || []);
  const [editingUser, setEditingUser] = useState(null);
  // const [registerUser, setRegisterUser] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  const handleEditClick = (user) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleAddClick = () => {
    navigate("/register");
  };

  const handleDeleteClick = async (id) => {
    try {
      await dispatch(deleteUser(id)).unwrap();
      toast.success("User deleted successfully!");
    } catch (error) {
      toast.error(`Error: ${error}`);
    }
  };

  const handleFormSubmit = async (userData) => {
    try {
      await dispatch(updateUser({ id: editingUser._id, updatedData: userData })).unwrap();
      toast.success("User updated successfully!");
      setShowForm(false);
    } catch (error) {
      toast.error(`Error: ${error}`);
    }
  };

  return (
    <div className="container p-4 md:mx-2 lg:ml-72">
     <div className="flex md:flex-row justify-between items-center mb-4 space-y-2 md:space-y-0">
        <h2 className="text-xl sm:text-2xl border p-1 rounded-md bg-blue-100 font-bold">User Management</h2>
        <button
          onClick={handleAddClick}
          className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition flex items-center space-x-2"
        >
          <FaPlus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Register User</span>
        </button>
      </div>
      <div className="space-y-4 md:space-y-2">
        {users.length > 0 ? (
          users.map((user) => (
            <div
              key={user._id}
              className="p-4 border rounded shadow flex justify-between items-center"
            >
              <div>
                <h3 className="text-lg font-semibold">{user.name}</h3>
                <p className="text-gray-600">{user.email}</p>
              </div>
              <div className="flex space-x-3">
                <button onClick={() => handleEditClick(user)} className="text-blue-500 hover:text-blue-700">
                  <FaEdit className="w-5 h-5" />
                </button>
                <button onClick={() => handleDeleteClick(user._id)} className="text-red-500 hover:text-red-700">
                  <FaTrash className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No users available</p>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 mx-2 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowForm(false)}
            >
              &times;
            </button>
            {/* User Form Component */}
            <UserForm
              onSubmit={handleFormSubmit}
              user={editingUser}
              onClose={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
