
import React from 'react';
import ForgotPassword from '../../Components/authComponents/forgotPassword';

const ForgotPasswordPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center text-gray-700">Forgot Password</h2>
        <ForgotPassword />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
