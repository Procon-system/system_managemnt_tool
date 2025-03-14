// src/components/ForgotPassword.js
import React, { useState } from 'react';
import { forgotPassword } from '../../Services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await forgotPassword({ email });
      setMessage(response.message);
    } catch (error) {
      console.error(error);
      setMessage('Failed to send reset link');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label>Email:</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full px-3 py-2 border rounded-lg"
      />
      <button type="submit" className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg">Send Reset Link</button>
      {message && <p>{message}</p>}
    </form>
  );
};

export default ForgotPassword;
