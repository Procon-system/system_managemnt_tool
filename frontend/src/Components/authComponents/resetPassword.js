// src/pages/Auth/ResetPassword.jsx
import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../../Services/authService';
import { toast } from 'react-toastify';
import { FiKey, FiEye, FiEyeOff, FiLoader, FiCheckCircle, FiLock } from 'react-icons/fi';

const rules = {
  minLen: (p) => p.length >= 8,
  upper:  (p) => /[A-Z]/.test(p),
  lower:  (p) => /[a-z]/.test(p),
  digit:  (p) => /[0-9]/.test(p),
  special:(p) => /[!@#$%^&*]/.test(p),
};

function validateField(name, value, ctx) {
  switch (name) {
    case 'password':
      if (!value) return 'Password is required.';
      if (!rules.minLen(value)) return 'Password must be at least 8 characters.';
      if (!(rules.upper(value) && rules.lower(value) && rules.digit(value) && rules.special(value))) {
        return 'Password needs uppercase, lowercase, number, and special character.';
      }
      return '';
    case 'confirmPassword':
      if (!value) return 'Please confirm your password.';
      if (value !== ctx.password) return 'Passwords do not match.';
      return '';
    default:
      return '';
  }
}

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const { token } = useParams();
  const navigate = useNavigate();

  const checks = useMemo(() => ({
    minLen:  rules.minLen(password),
    upper:   rules.upper(password),
    lower:   rules.lower(password),
    digit:   rules.digit(password),
    special: rules.special(password),
  }), [password]);

  const isFormValid = useMemo(() => {
    const pErr = validateField('password', password, { password });
    const cErr = validateField('confirmPassword', confirmPassword, { password });
    return !pErr && !cErr;
  }, [password, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const pErr = validateField('password', password, { password });
    const cErr = validateField('confirmPassword', confirmPassword, { password });
    const newErrors = {};
    if (pErr) newErrors.password = pErr;
    if (cErr) newErrors.confirmPassword = cErr;
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix the errors before submitting.');
      return;
    }
    if (!token) {
      toast.error('Missing or invalid reset token.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await resetPassword(token, { password, confirmPassword });
      setSuccess(response?.message || 'Password reset successfully!');
      toast.success('Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const msg = err?.message || 'An unexpected error occurred.';
      setErrors((prev) => ({ ...prev, password: msg }));
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4 animate-fade-in">
        <FiCheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <h2 className="text-2xl font-bold text-gray-800">Success!</h2>
        <p className="text-gray-600">{success}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <FiLock className="mx-auto h-12 w-12 text-blue-600" />
        <h2 className="mt-4 text-3xl font-extrabold text-gray-900">Set a New Password</h2>
        <p className="mt-2 text-sm text-gray-600">Please enter and confirm your new password below.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* New Password */}
        <div>
          <div className="relative">
            <FiKey className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-600" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                const val = e.target.value;
                setPassword(val);
                if (errors.password) {
                  setErrors((prev) => ({ ...prev, password: validateField('password', val, { password: val }) }));
                }
              }}
              required
              placeholder="New Password"
              className="w-full pl-10 pr-10 py-3 border border-gray-500 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          {/* Live checklist (matches your register page) */}
          <div className="text-sm text-gray-600 pl-1 mt-3 space-y-1">
            <p className={checks.minLen ? 'text-green-600' : 'text-gray-600'}>✓ At least 8 characters</p>
            <p className={checks.upper  ? 'text-green-600' : 'text-gray-600'}>✓ One uppercase letter</p>
            <p className={checks.lower  ? 'text-green-600' : 'text-gray-600'}>✓ One lowercase letter</p>
            <p className={checks.digit  ? 'text-green-600' : 'text-gray-600'}>✓ One number</p>
            <p className={checks.special? 'text-green-600' : 'text-gray-600'}>✓ One special character (!@#$%^&*)</p>
          </div>

          {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <div className="relative">
            <FiKey className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-600" />
            <input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                const val = e.target.value;
                setConfirmPassword(val);
                if (errors.confirmPassword) {
                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword: validateField('confirmPassword', val, { password }),
                  }));
                }
              }}
              required
              placeholder="Confirm New Password"
              className="w-full pl-10 pr-10 py-3 border border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading || !isFormValid}
          className="w-full flex justify-center items-center px-4 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
        >
          {isLoading ? (
            <>
              <FiLoader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              Resetting...
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
