
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_BASE_URL}/api/auth`;

export class CustomError extends Error {
  constructor(message, code, extra = {}) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    Object.assign(this, extra);
  }
}
export const adminRegister = async (fullUserData) => {
  const request = { 
    method: 'post',
    url: `${API_URL}/admin-registration`, 
    data: fullUserData,
  };

  try {
    const response = await axios(request);
    return response.data; 
  } catch (error) {
    const errorResponse = error.response?.data;
    const errorMessage = errorResponse?.message || error.message || 'Error during registration';
    const errorCode = error.response?.status === 409 ? 'CONFLICT_ERROR' : 'REGISTRATION_ERROR';

    throw new CustomError(
      errorMessage,
      errorCode,
      { ...errorResponse }
    );
  }
};
// **Register User**
export const registerUser = async (userData, token) => {
  const request = { 
    method: 'post', 
    url: `${API_URL}/register`, 
    data: userData,
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  try {
    const response = await axios(request);
    return response.data;
  } catch (error) {
   
    const errorResponse = error.response?.data;

    // Handle USER_LIMIT_REACHED specifically if it has a unique structure
    if (errorResponse?.code === 'USER_LIMIT_REACHED') {
      throw new CustomError(
        errorResponse.message,
        'USER_LIMIT_REACHED',
        { ...errorResponse }
      );
    }

    const errorMessage = errorResponse?.message || error.message || 'Error during registration';

    throw new CustomError(
      errorMessage,
      'REGISTRATION_ERROR'
    );
    
  }
};

export const loginUser = async (credentials) => {
  const request = {
    method: 'post',
    url: `${API_URL}/login`,
    data: credentials,
    headers: { 'Content-Type': 'application/json' },
  };

  try {
    const response = await axios(request);
   
     return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};
// **Logout User**
export const logoutUser = async () => {
  const request = { method: 'post', url: `${API_URL}/logout` };

  try {
    const response = await axios(request);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Logout failed');
  }
};

// **Forgot Password**
export const forgotPassword = async (emailData) => {
  const request = { method: 'post', url: `${API_URL}/forgot-password`, data: emailData };

  try {
    const response = await axios(request);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Error during email confirmation');
  }
};

// **Reset Password**
export const resetPassword = async (token, passwordData) => {
  // The endpoint no longer includes the ID.
  const request = { 
    method: 'post', 
    url: `${API_URL}/reset-password/${token}`, 
    data: passwordData // { password: '...' }
  };

  try {
    const response = await axios(request);
    return response.data; // Should return { success: true, message: '...' }
  } catch (error) {
    // Re-throw a clean error message for the component to catch
    throw new Error(error.response?.data?.error || 'Error during password reset');
  }
};

// **Confirm Email**
export const confirmEmail = async (confirmationCode) => {
  const request = { method: 'post', url: `${API_URL}/confirm-email/${confirmationCode}` };

  try {
    const response = await axios(request);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Error confirming email');
  }
};

