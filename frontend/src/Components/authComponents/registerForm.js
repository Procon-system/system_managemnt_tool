// src/components/RegisterForm.js
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { login } from '../../features/authSlice';
import { registerUser } from '../../Services/authService';
import FormInput from './inputForm';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
const RegisterForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    personal_number: '',
    working_group: '',
    access_level: '',
  });
  const [error, setError] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await registerUser(formData);
  
      if (response && response.user && response.token) {
        const { user, token } = response;
        dispatch(login({ user, token }));
        setConfirmationMessage('Please check your email to confirm your registration.');
        toast.success('Registration successful!');
        // Redirect to the login page after successful registration
        navigate('/login');
      } else {
        console.error('Unexpected response structure:', response);
      }
    } catch (error) {
      console.error('Registration error:', error.message);
      toast.error(`Error: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput label="First Name" name="first_name" type="text" value={formData.first_name} onChange={handleChange} required />
      <FormInput label="Last Name" name="last_name" type="text" value={formData.last_name} onChange={handleChange} required />
      <FormInput label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
      <FormInput label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
      <FormInput label="Personal Number" name="personal_number" type="text" value={formData.personal_number} onChange={handleChange} />
    {/* Access Level Dropdown */}
    <FormInput
      label="Access Level"
      name="access_level"
      type="text"
      value={formData.access_level}
      onChange={handleChange}
      required
      options={['1', '2', '3', '4', '5']}
    />
      {error && <p className="text-red-500">{error}</p>}
      {confirmationMessage && <p className="text-green-500">{confirmationMessage}</p>}

      <button
        type="submit"
        className="w-full px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        Register
      </button>
    </form>
  );
};

export default RegisterForm;
