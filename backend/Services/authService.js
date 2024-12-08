
const bcrypt = require('bcryptjs');
const { db } = require('../config/couchdb');
const UserModel = require('../Models/UserSchema');
const hashPassword = require('../Middleware/hashPassword');
const generateToken = require('../Middleware/generateToken');
const registerValidator = require('../Helper/registerValidator');
const { generateConfirmationCode } = require('../Helper/generateConfirmationCode');
const {
  sendConfirmationEmail,
  sendWelcomeEmail,
  sendRestPasswordLink,
} = require('../Helper/sendEmail');

const createUser = async (userData) => {
  // Validate required fields
  const { email, password, first_name, last_name, personal_number, access_level } = userData;

  const validation = registerValidator.validate({ email, password });
  if (validation.error) {
    throw new Error(validation.error.details.map((d) => d.message).join('<br>'));
  }

  // Check for existing users
  const existingEmail = await db.find({ selector: { type: 'user', email } });
  if (existingEmail.docs.length) throw new Error('Email already registered.');

  const existingPersonalNumber = await db.find({ selector: { type: 'user', personal_number } });
  if (existingPersonalNumber.docs.length) throw new Error('Personal number already registered.');

  // Create new user
  const newUser = {
    ...UserModel,
    _id: `user:${Date.now()}`,
    email,
    password: await hashPassword(password),
    first_name,
    last_name,
    personal_number,
    access_level,
    confirmationCode: generateConfirmationCode(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const response = await db.insert(newUser);
  return { ...newUser, _rev: response.rev };
};

const findUserByEmail = async (email) => {
  const result = await db.find({ selector: { type: 'user', email } });
  return result.docs[0] || null;
};

const findUserByConfirmationCode = async (confirmationCode) => {
  const result = await db.find({ selector: { type: 'user', confirmationCode } });
  return result.docs[0] || null;
};

const updateUser = async (id, updates) => {
  const user = await db.get(id);
  const updatedUser = {
    ...user,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  const response = await db.insert(updatedUser);
  return { ...updatedUser, _rev: response.rev };
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserByConfirmationCode,
  updateUser,
};
