const Joi = require('joi');

// Registration validation
const validateRegistration = (data) => {
  const schema = Joi.object({
    email: Joi.string()
      .email({ minDomainSegments: 2 })
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required'
      }),
    password: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base': 'Password must contain at least one lowercase, one uppercase, one number and one special character',
        'string.empty': 'Password is required'
      })
  });

  return schema.validate(data);
};

// Password reset validation
const validatePasswordReset = (data) => {
  const schema = Joi.object({
    password: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base': 'Password must contain at least one lowercase, one uppercase, one number and one special character',
        'string.empty': 'Password is required'
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Passwords do not match',
        'string.empty': 'Please confirm your password'
      })
  });

  return schema.validate(data);
};
// utils/passwordRules.js
const validatePasswordStrength = (pw, ctx = {}) => {
  const issues = [];
  if (typeof pw !== "string" || !pw) issues.push("be provided");
  else {
    if (pw.length < 8) issues.push("be at least 8 characters");
    if (!/[a-z]/.test(pw)) issues.push("include a lowercase letter");
    if (!/[A-Z]/.test(pw)) issues.push("include an uppercase letter");
    if (!/[0-9]/.test(pw)) issues.push("include a digit");
    if (!/[^?=.*[!@#$%^&*]/.test(pw)) issues.push("include a special character");
    const { email, first_name, last_name } = ctx;
    const lowers = [email, first_name, last_name].filter(Boolean).map(s => s.toLowerCase());
    const pl = pw.toLowerCase();
    if (lowers.some(s => s.length >= 3 && pl.includes(s))) {
      issues.push("not contain your name or email");
    }
  }
  return { ok: issues.length === 0, message: issues.length ? `Password must ${issues.join(", ")}.` : null };
};

module.exports = {
  validatePasswordStrength,
  validateRegistration,
  validatePasswordReset
};