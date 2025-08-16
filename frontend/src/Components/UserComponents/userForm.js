
import React, { useState, useEffect, useCallback } from 'react';
import FormInput from '../../Components/authComponents/inputForm';
import { RESERVED_STATUS_COLORS, isColorReserved } from '../../utils/colorUtils';

const validate = (name, value) => {
  switch (name) {
    case 'email':
      if (!value) return 'Email is required.';
      if (!/\S+@\S+\.\S+/.test(value)) return 'Please provide a valid email address.';
      return '';
    case 'first_name':
    case 'last_name':
      return value.trim() === '' ? 'This field is required.' : '';
    case 'access_level':
      return value === '' ? 'Please select a role.' : '';
    case 'payroll.rate':
      if (value && isNaN(parseFloat(value))) return 'Rate must be a valid number.';
      return '';
    default:
      return '';
  }
};
const getInitials = (firstName = '', lastName = '') => {
  const fInitial = firstName ? firstName[0] : '';
  const lInitial = lastName ? lastName[0] : '';
  if (fInitial && lInitial) {
    return `${fInitial}${lInitial}`.toUpperCase();
  }
  if (fInitial) {
    return fInitial.toUpperCase();
  }
  return '??';
};

const getContrastingTextColor = (hexColor) => {
  if (!hexColor || hexColor.length < 7) return '#000000'; // Default to black
  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#FFFFFF';
};
const UserForm = ({ onSubmit, user = {}, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    personal_number: '',
    access_level: '',
    color: '#e0f2fe', 
    payroll: {
      rate_type: 'hourly',
      rate: '',
      currency: 'USD',
      overtime_multiplier: '1.5',
    },
  });
  const [errors, setErrors] = useState({});

  // Populate form with user once on mount or when `user` changes
  useEffect(() => {
    setFormData({
      email:           user.email           || '',
      first_name:      user.first_name      || '',
      last_name:       user.last_name       || '',
      personal_number: user.personal_number || '',
      access_level:    user.access_level    || '',
      color:           user.color           || '#e0f2fe',
      payroll: {
        rate_type:          user.payroll?.rate_type          || 'hourly',
        rate:               user.payroll?.rate               || '',
        currency:           user.payroll?.currency           || 'USD',
        overtime_multiplier: user.payroll?.overtime_multiplier || '1.5',
      },
    });
    setErrors({});
  }, [user]);

  // Only validate visible fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name.startsWith('payroll.')) {
        const field = name.split('.')[1];
        return { 
          ...prev, 
          payroll: { ...prev.payroll, [field]: value }
        };
      }
      return { ...prev, [name]: value };
    });
    // run validation
    setErrors(prev => ({
      ...prev,
      [name]: validate(name, value)
    }));
  };
  const handleColorChange = (e) => {
    const newColor = e.target.value;

    // Check if the new color is too close to a reserved status color
    if (isColorReserved(newColor, RESERVED_STATUS_COLORS)) {
      // If it is, set an error message and DO NOT update the form data.
      setErrors(prev => ({
        ...prev,
        color: 'This color is reserved for statuses. Please choose another.'
      }));
    } else {
      // If the color is valid, clear any existing color error.
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.color; // Remove the color error key
        return newErrors;
      });
      // And then proceed to call the original handleChange to update the form data.
      handleChange(e);
    }
  };
  const isFormValid = useCallback(() => {

    if (validate('email', formData.email)) return false;

    if (user.role === 'user') {
      if (validate('first_name', formData.first_name)) return false;
      if (validate('last_name', formData.last_name)) return false;
      if (validate('access_level', formData.access_level)) return false;
    }

    if (formData.payroll.rate && validate('payroll.rate', formData.payroll.rate)) {
      return false;
    }
    if (errors.color) return false;
    
    return true;
  }, [formData, user.role,errors.color]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = {};

    // always check email
    const emailErr = validate('email', formData.email);
    if (emailErr) validationErrors.email = emailErr;

    if (user.role === 'user') {
      ['first_name','last_name','access_level'].forEach(field => {
        const err = validate(field, formData[field]);
        if (err) validationErrors[field] = err;
      });
      const prErr = validate('payroll.rate', formData.payroll.rate);
      if (prErr) validationErrors['payroll.rate'] = prErr;
    }

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    // Build payload
    const payload = { email: formData.email };
    if (user.role === 'user') {
      payload.first_name      = formData.first_name;
      payload.last_name       = formData.last_name;
      payload.personal_number = formData.personal_number;
      payload.access_level    = formData.access_level;
      payload.color           = formData.color;
      payload.payroll         = formData.payroll;
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">Edit {user.role === 'monitor' ? 'Monitor' : 'User'}</h2>

      {/* Email is always editable */}
      <FormInput
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        required
      />

      {/* Everything below is only for normal users */}
      {user.role === 'user' && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 ">
            
            {/* Name Inputs */}
            <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <FormInput
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                error={errors.first_name}
                required
              />
              <FormInput
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                error={errors.last_name}
                required
              />
            </div>

            <div className="flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Color
              </label>
              <label 
                htmlFor="color-picker-input"
                className="relative w-10 h-10 rounded-full flex items-center justify-center cursor-pointer border-2 border-gray-300 transition-transform hover:scale-105"
                style={{ backgroundColor: formData.color }}
              >
                <span 
                  className="font-bold text-xl select-none"
                  style={{ color: getContrastingTextColor(formData.color) }}
                >
                  {getInitials(formData.first_name, formData.last_name)}
                </span>
                <input
                  id="color-picker-input"
                  type="color"
                  name="color"
                  value={formData.color}
                  // NEW: Use our custom validation handler instead of the generic one
                  onChange={handleColorChange}
                  className="absolute w-full h-full opacity-0 cursor-pointer"
                />
              </label>
              {/* NEW: Conditionally render the error message for the color picker */}
              {errors.color && (
                <p className="text-red-600 text-xs mt-1 w-48">
                  {errors.color}
                </p>
              )}
            </div>
          </div>
          
         
          
          {/* -- Other Details in a Grid -- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Personal Number"
              name="personal_number"
              type="text"
              value={formData.personal_number}
              onChange={handleChange}
              error={errors.personal_number}
            />
            <FormInput
              label="Access Level"
              name="access_level"
              type="select"
              value={formData.access_level}
              onChange={handleChange}
              options={[
                { value: 1, description: '1 - Random' },
                { value: 2, description: '2 - Service Personnel' },
                { value: 3, description: '3 - Manager' },
              ]}
              error={errors.access_level}
              required
            />
          </div>

          {/* -- Payroll Information Fieldset -- */}
          <fieldset className="border p-4 rounded-lg">
            <legend className="text-sm font-medium px-2">Payroll Information</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <FormInput
                label="Rate Type"
                name="payroll.rate_type"
                type="select"
                value={formData.payroll.rate_type}
                onChange={handleChange}
                options={[
                  { value: 'hourly', description: 'Hourly' },
                  { value: 'salaried', description: 'Salaried' },
                  { value: 'project', description: 'Per Project' },
                ]}
              />
              <FormInput
                label="Rate"
                name="payroll.rate"
                type="number"
                step="0.01"
                value={formData.payroll.rate}
                onChange={handleChange}
                error={errors['payroll.rate']}
                placeholder="e.g., 25.50"
              />
              <FormInput
                label="Currency"
                name="payroll.currency"
                type="text"
                value={formData.payroll.currency}
                onChange={handleChange}
                placeholder="e.g., USD"
              />
              <FormInput
                label="Overtime Multiplier"
                name="payroll.overtime_multiplier"
                type="number"
                step="0.1"
                value={formData.payroll.overtime_multiplier}
                onChange={handleChange}
              />
            </div>
          </fieldset>
        </>
      )}

      {/* Action buttons */}
      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isFormValid()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default UserForm;
