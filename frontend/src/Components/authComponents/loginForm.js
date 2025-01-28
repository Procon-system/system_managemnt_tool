
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { login } from '../../features/authSlice';
import { loginUser } from '../../Services/authService';
import FormInput from './inputForm';
import { useNavigate,Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {jwtDecode} from "jwt-decode";
const LoginForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
      email: '',
      password: '',
      rememberMe: false,
    });
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      if (name === 'rememberMe') {
        setFormData({ ...formData, rememberMe: e.target.checked });
      } else {
        setFormData({ ...formData, [name]: value });
      }
    };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Make API call to log in the user
      const response = await loginUser(formData);
  
      if (!response) throw new Error("Invalid response from the server.");
      const { user,token } = response;
  
      // Decode the JWT to extract user details, including access_level
      const decodedToken = jwtDecode(token);
  
      if (!decodedToken) throw new Error("Failed to decode token.");
  
      const { access_level } = decodedToken;
  
      // Save token to localStorage for persistence
      localStorage.setItem("token", token);
  
      // Dispatch login action to update Redux state
      dispatch(
        login({
          user: user, // Full user object
          token,
          access_level, // Include access level explicitly
        })
      );

      // Show success toast notification
      toast.success("Login successful!");
  
      // Navigate to the home page
      navigate("/home");
    } catch (error) {
      console.error("Login error:", error.message || error);
  
      // Show error toast notification
      toast.error(`Login failed: ${error.response?.data?.message || error.message}`);
    }
  };
  return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
        <FormInput label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
        <div className="flex items-center justify-between">
    <FormInput label="Remember Me" name="rememberMe" type="checkbox" checked={formData.rememberMe} onChange={handleChange} />
    <Link to="/forgot-password" className="text-blue-500 hover:underline">
      Forgot Password?
    </Link>
    
  </div>
        <button
          type="submit"
          className="w-full px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Login
        </button>
        <div className='mt-3'>
        <Link to="/register" className="text-blue-500 hover:underline">
      Don't you have an account? Register
    </Link>
        </div>
        {/* Forgot Password Link */}
        
      </form>
  );
};

export default LoginForm;
