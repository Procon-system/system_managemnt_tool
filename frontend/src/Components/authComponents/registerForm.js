import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { registerUsers } from '../../features/authSlice';
import FormInput from './inputForm';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const RegisterForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    personal_number: '',
    access_level: 1,
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
      const resultAction = await dispatch(registerUsers(formData));
      
      if (registerUsers.fulfilled.match(resultAction)) {
        toast.success('User registered successfully!');
        
        // Reset form data after successful registration
        setFormData({
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          personal_number: '',
          access_level: 1,
        });
        
        navigate('/home');
      } else if (registerUsers.rejected.match(resultAction)) {
        const error = resultAction.payload;
        
        if (error.code === 'USER_LIMIT_REACHED') {
          toast.error(
            <div className="p-4">
              <p className="font-medium">{error.message}</p>
              <p className="my-2">
                Current: {error.details?.currentCount || 'N/A'}/
                {error.details?.maxAllowed || 'N/A'} users
              </p>
              {error.details?.upgradeAvailable && (
                <div className="mt-3">
                  <Link 
                    to={error.actions?.[0]?.url || '/subscription'} 
                    className="text-blue-600 hover:text-blue-800 font-medium underline"
                    onClick={() => toast.dismiss()}
                  >
                    {error.actions?.[0]?.label || 'Upgrade subscription'}
                  </Link>
                </div>
              )}
            </div>,
            {
              position: "top-right",
              autoClose: false,
              className: 'border-l-4 border-red-500'
            }
          );
        } else {
          toast.error(error.message || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    }
  };
  // const handleSubmit = async (e) => {
  //   e.preventDefault();
    
  //   try {
  //     const resultAction = await dispatch(registerUsers(formData));
      
  //     if (registerUsers.fulfilled.match(resultAction)) {
  //       toast.success('User registered successfully!');
  //       navigate('/home');
  //     } else if (registerUsers.rejected.match(resultAction)) {
  //       const error = resultAction.payload;
        
  //       if (error.code === 'USER_LIMIT_REACHED') {
  //         toast.error(
  //           <div className="p-4">
  //             <p className="font-medium">{error.message}</p>
  //             <p className="my-2">
  //               Current: {error.details?.currentCount || 'N/A'}/
  //               {error.details?.maxAllowed || 'N/A'} users
  //             </p>
  //             {error.details?.upgradeAvailable && (
  //               <div className="mt-3">
  //                 <Link 
  //                   to={error.actions?.[0]?.url || '/subscription'} 
  //                   className="text-blue-600 hover:text-blue-800 font-medium underline"
  //                   onClick={() => toast.dismiss()}
  //                 >
  //                   {error.actions?.[0]?.label || 'Upgrade subscription'}
  //                 </Link>
  //               </div>
  //             )}
  //           </div>,
  //           {
  //             position: "top-right",
  //             autoClose: false,
  //             className: 'border-l-4 border-red-500'
  //           }
  //         );
  //       } else {
  //         toast.error(error.message || 'Registration failed');
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Unexpected error:', error);
  //     toast.error('An unexpected error occurred');
  //   }
  // };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput label="First Name" name="first_name" type="text" value={formData.first_name} onChange={handleChange} required />
      <FormInput label="Last Name" name="last_name" type="text" value={formData.last_name} onChange={handleChange} required />
      <FormInput label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
      <FormInput label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
      <p className="text-sm text-blue-600">
        Password must be at least 6 characters long and include a mix of letters and numbers.
      </p>
      <FormInput label="Personal Number" name="personal_number" type="text" value={formData.personal_number} onChange={handleChange} />
     
      <FormInput
        label="Access Level"
        name="access_level"
        type="select" // Changed from 'text' to 'select'
        value={formData.access_level}
        onChange={handleChange}
        required
        options={[
          { value: 1, description: '1 - Random User' },
          { value: 2, description: '2 - Service Personnel' },
          { value: 3, description: '3 - Manager' },
          { value: 4, description: '4 - Free' },
          // { value: 5, description: '5 - Admin' },
        ]}
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