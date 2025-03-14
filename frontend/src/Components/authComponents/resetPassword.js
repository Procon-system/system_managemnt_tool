import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../../Services/authService';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const { id,token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await resetPassword(id,token, { password });
      setMessage(response.message);
      navigate('/login');
    } catch (error) {
      console.error(error);
      setMessage('Failed to reset password');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label>New Password:</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full px-3 py-2 border rounded-lg"
      />
      <button type="submit" className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg">Reset Password</button>
      {message && <p>{message}</p>}
    </form>
  );
};

export default ResetPassword;
