import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import { setCredentials } from '../../features/authSlice'; // <-- Import your action

// Import icons from react-icons
import { CgSpinner } from 'react-icons/cg';
import { HiCheckCircle, HiXCircle } from 'react-icons/hi';

const AuthHandoff = () => {
  // 'loading', 'success', 'error'
  const [uiState, setUiState] = useState('loading');
  const [message, setMessage] = useState('Initializing secure handoff...');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const flaskId = urlParams.get('flaskId');

    if (!flaskId) {
      setUiState('error');
      setMessage('Authentication failed: Missing identifier.');
      setTimeout(() => navigate('/login'), 4000);
      return;
    }

    const socket = io(`${process.env.REACT_APP_API_BASE_URL}`, {
      query: { handoff: 'true' }
    });

    socket.on('connect', () => {
      console.log('Connected to handoff socket.');
      const roomName = `handoff:${flaskId}`;
      socket.emit('join_handoff_room', roomName);
      setMessage('Securely waiting for authentication token...');
    });

    
    socket.on('auth_token', (data) => {
     
      const tokenString = data.token;
      if (!tokenString || typeof tokenString !== 'string' || !tokenString.includes('.')) {
        console.error("Invalid token received in payload from server:", data);
        setUiState('error');
        setMessage('Received an invalid authentication payload from the server.Please login again');
        setTimeout(() => navigate('/login'), 4000);
        return;
      }

      localStorage.setItem('authToken', tokenString);
      dispatch(setCredentials(data));

      setUiState('success');
      setMessage('Success! Redirecting to Tasknitter...');
      
      setTimeout(() => {
        socket.disconnect();
        navigate('/home');
      }, 2000);
    });
    socket.on('connect_error', (err) => {
      setUiState('error');
      setMessage(`Connection failed: ${err.message}. Please try again.`);
      setTimeout(() => navigate('/login'), 4000);
    });

    // Cleanup on component unmount
    return () => {
      socket.disconnect();
    };
  }, [navigate]);

  // Helper component to render the correct icon and styling
  const StatusIcon = () => {
    switch (uiState) {
      case 'loading':
        return <CgSpinner className="animate-spin text-blue-500" size={56} />;
      case 'success':
        return <HiCheckCircle className="text-green-500" size={56} />;
      case 'error':
        return <HiXCircle className="text-red-500" size={56} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-start justify-center min-h-screen pt-20">
      <div className="w-full max-w-md p-8 space-y-6 bg-blue-50 rounded-lg shadow-md">
        <div className="flex justify-center">
          <StatusIcon />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">
            Authentication in Progress
          </h2>
          <p className="mt-2 text-gray-600">
            {message}
          </p>
        </div>
        {uiState === 'error' && (
          <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
            You will be redirected to the login page shortly.
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthHandoff;