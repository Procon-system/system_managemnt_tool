
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { login } from '../../Store/authSlice';
import { loginUser } from '../../Services/authService';
import FormInput from './inputForm';
import { useNavigate } from 'react-router-dom';
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
        const response = await loginUser(formData);
        const { user, token } = response;
  
        // Dispatch login action to update Redux state
        dispatch(login({ user, token }));
  
       
            navigate('/home');
      } catch (error) {
        console.error('Login error:', error.response.data.error);
           }
    };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
      <FormInput label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
      <FormInput label="Remember Me" name="rememberMe" type="checkbox" value={formData.rememberMe} onChange={handleChange} required />

      <button
        type="submit"
        className="w-full px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        Login
      </button>
    </form>
  );
};

export default LoginForm;
