
import React from 'react';
import ResetPassword from '../../Components/authComponents/resetPassword';

const ResetPasswordPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center mb-6">Reset Your Password</h2>
        <ResetPassword />
      </div>
    </div>
  );
};

export default ResetPasswordPage;
