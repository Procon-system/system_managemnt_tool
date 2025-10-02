// validators.js
export const validate = (name, value, formData = {}) => {
    switch (name) {
      case 'first_name':
      case 'last_name':
        return value.trim() === '' ? 'This field is required.' : '';
  
      case 'email':
        if (!value) return 'Email is required.';
        if (!/\S+@\S+\.\S+/.test(value)) return 'Please provide a valid email address.';
        return '';
  
      // for profile change flow, the password fields are optional unless the user opens the change-password section
      case 'currentPassword':
        // required only if newPassword/confirmPassword present
        if ((formData.newPassword || formData.confirmPassword) && !value) {
          return 'Current password is required.';
        }
        return '';
  
      case 'newPassword':
        if (!value) return 'Password is required.';
        if (value.length < 8) return 'Password must be at least 8 characters.';
        if (!/[A-Z]/.test(value)) return 'Include at least one uppercase letter.';
        if (!/[a-z]/.test(value)) return 'Include at least one lowercase letter.';
        if (!/[0-9]/.test(value)) return 'Include at least one number.';
        if (!/[!@#$%^&*]/.test(value)) return 'Include at least one special character.';
        return '';
  
      case 'confirmPassword':
        if (!value) return 'Please confirm your password.';
        if (value !== formData.newPassword) return 'Passwords do not match.';
        return '';
  
      case 'payroll.rate':
        if (value && isNaN(parseFloat(value))) return 'Rate must be a number.';
        return '';
  
      default:
        return '';
    }
  };
  
  // convenience checker for the whole form when submitting
  export const hasErrors = (fields, formData) => {
    for (const name of fields) {
      const msg = validate(name, formData[name], formData);
      if (msg) return true;
    }
    return false;
  };
// components/PasswordChecklist.jsx
export const PasswordChecklist=({ password = "" })=> {
    const ok = (re) => re.test(password);
    return (
      <div className="text-sm text-gray-600 pl-1 mt-3 space-y-1">
        <p className={password.length >= 8 ? 'text-green-600' : 'text-gray-600'}>✓ At least 8 characters</p>
        <p className={ok(/(?=.*[A-Z])/)? 'text-green-600' : 'text-gray-600'}>✓ One uppercase letter</p>
        <p className={ok(/(?=.*[a-z])/)? 'text-green-600' : 'text-gray-600'}>✓ One lowercase letter</p>
        <p className={ok(/(?=.*[0-9])/)? 'text-green-600' : 'text-gray-600'}>✓ One number</p>
        <p className={ok(/(?=.*[!@#$%^&*])/)? 'text-green-600' : 'text-gray-600'}>
          ✓ One special character (!@#$%^&*)
        </p>
      </div>
    );
  }
    