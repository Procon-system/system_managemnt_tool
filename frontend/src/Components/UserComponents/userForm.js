// import React, { useState, useEffect, useCallback } from 'react';
// import FormInput from '../../Components/authComponents/inputForm'; 
// const validate = (name, value) => {
//   switch (name) {
//     case 'first_name':
//     case 'last_name':
//       return value.trim() === '' ? 'This field is required.' : '';
//     case 'email':
//       if (!value) return 'Email is required.';
//       if (!/\S+@\S+\.\S+/.test(value)) return 'Please provide a valid email address.';
//       return '';
//     case 'access_level':
//       return value === '' || value === null ? 'Please select a role.' : '';
//     // Validation for optional payroll rate field
//     case 'payroll.rate':
//       if (value && isNaN(parseFloat(value))) return 'Rate must be a valid number.';
//       return '';
//     // Personal number is optional, so no validation needed unless specified
//     default:
//       return '';
//   }
// };

// const UserForm = ({ onSubmit, user, onClose }) => {
//   const [formData, setFormData] = useState({
//     first_name: '',
//     last_name: '',
//     email: '',
//     access_level: '',
//     personal_number: '', // Added personal_number
//     payroll: {          // Added payroll object
//       rate_type: 'hourly',
//       rate: '',
//       currency: 'USD',
//       overtime_multiplier: '1.5',
//     },
//   });
//   const [errors, setErrors] = useState({});

//   // Populate form data when the 'user' prop changes, now including new fields
//   useEffect(() => {
//     if (user) {
//       setFormData({
//         first_name: user.first_name || '',
//         last_name: user.last_name || '',
//         email: user.email || '',
//         access_level: user.access_level || '',
//         personal_number: user.personal_number || '',
//         // Safely populate payroll, providing defaults if it doesn't exist on the user object
//         payroll: {
//           rate_type: user.payroll?.rate_type || 'hourly',
//           rate: user.payroll?.rate || '',
//           currency: user.payroll?.currency || 'USD',
//           overtime_multiplier: user.payroll?.overtime_multiplier || '1.5',
//         },
//       });
//       setErrors({});
//     }
//   }, [user]);

//   const isFormValid = useCallback(() => {
//     const hasNoErrors = Object.values(errors).every(error => error === '');
//     const hasAllRequiredFields = formData.first_name && formData.last_name && formData.email && formData.access_level;
//     return hasNoErrors && hasAllRequiredFields;
//   }, [errors, formData]);

//   // Handle changes for both top-level and nested (payroll) fields
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     let newFormData;

//     if (name.startsWith('payroll.')) {
//       const payrollField = name.split('.')[1];
//       newFormData = {
//         ...formData,
//         payroll: { ...formData.payroll, [payrollField]: value },
//       };
//     } else {
//       newFormData = { ...formData, [name]: value };
//     }
//     setFormData(newFormData);

//     const error = validate(name, value);
//     setErrors(prevErrors => ({ ...prevErrors, [name]: error }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     const finalErrors = {};
    
//     // Create a flat map of all fields to validate, including nested ones
//     const fieldsToValidate = {
//       ...formData,
//       'payroll.rate_type': formData.payroll.rate_type,
//       'payroll.rate': formData.payroll.rate,
//       'payroll.currency': formData.payroll.currency,
//       'payroll.overtime_multiplier': formData.payroll.overtime_multiplier,
//     };
//     delete fieldsToValidate.payroll; // remove the object itself

//     for (const [name, value] of Object.entries(fieldsToValidate)) {
//         const error = validate(name, value);
//         if (error) finalErrors[name] = error;
//     }
    
//     setErrors(finalErrors);

//     if (Object.keys(finalErrors).length === 0) {
//       onSubmit(formData);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-2">
//       <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit User</h2>

//       {/* --- User Information --- */}
//       <FormInput label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} error={errors.first_name} required />
//       <FormInput label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} error={errors.last_name} required />
//       <FormInput label="Email" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} required />
//       <FormInput label="Personal Number" name="personal_number" type="text" value={formData.personal_number} onChange={handleChange} error={errors.personal_number} />
//       <FormInput
//         label="Access Level"
//         name="access_level"
//         type="select"
//         value={formData.access_level}
//         onChange={handleChange}
//         error={errors.access_level}
//         required
//         options={[
//           { value: 1, description: '1 - Random' },
//           { value: 2, description: '2 - Service Personnel' },
//           { value: 3, description: '3 - Manager' },
         
//         ]}
//       />

//       {/* --- Payroll Information --- */}
//       <fieldset className="border border-gray-300 p-4 rounded-lg mt-6">
//         <legend className="text-sm font-medium text-gray-700 px-2">Payroll Information</legend>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <FormInput
//             label="Rate Type"
//             name="payroll.rate_type"
//             type="select"
//             value={formData.payroll.rate_type}
//             onChange={handleChange}
//             options={[
//               { value: 'hourly', description: 'Hourly' },
//               { value: 'salaried', description: 'Salaried' },
//               { value: 'project', description: 'Per Project' },
//             ]}
//           />
//           <FormInput
//             label="Rate"
//             name="payroll.rate"
//             type="number"
//             value={formData.payroll.rate}
//             onChange={handleChange}
//             error={errors['payroll.rate']}
//             placeholder="e.g., 25.50"
//             step="0.01"
//           />
//           <FormInput
//             label="Currency"
//             name="payroll.currency"
//             type="text"
//             value={formData.payroll.currency}
//             onChange={handleChange}
//             placeholder="e.g., USD"
//           />
//           <FormInput
//             label="Overtime Multiplier"
//             name="payroll.overtime_multiplier"
//             type="number"
//             value={formData.payroll.overtime_multiplier}
//             onChange={handleChange}
//             step="0.1"
//           />
//         </div>
//       </fieldset>

//       {/* --- Action Buttons --- */}
//       <div className="flex justify-end space-x-3 pt-4">
//         <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition">
//           Cancel
//         </button>
//         <button type="submit" disabled={!isFormValid()} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed">
//           Save Changes
//         </button>
//       </div>
//     </form>
//   );
// };

// export default UserForm;

import React, { useState, useEffect, useCallback } from 'react';
import FormInput from '../../Components/authComponents/inputForm';

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

const UserForm = ({ onSubmit, user = {}, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    personal_number: '',
    access_level: '',
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

  const isFormValid = useCallback(() => {
    // email always required + valid
    if (validate('email', formData.email)) return false;

    // if user-role, require names+access_level
    if (user.role === 'user') {
      if (validate('first_name', formData.first_name)) return false;
      if (validate('last_name', formData.last_name)) return false;
      if (validate('access_level', formData.access_level)) return false;
    }

    // payroll.rate optional but if present must be valid
    if (formData.payroll.rate && validate('payroll.rate', formData.payroll.rate)) {
      return false;
    }

    return true;
  }, [formData, user.role]);

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

          <fieldset className="border p-4 rounded-lg mt-4">
            <legend className="text-sm font-medium">Payroll Information</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
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
