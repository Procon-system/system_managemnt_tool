// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true, 
  },
  password: {
    type: String,
    required: true,
  },
  last_name:{
    type:String,
    required: true,
  },
  first_name:{
    type:String,
    required: true,
  },
  personal_number:{
    type:String,
    unique: true,

  },
  working_group:{
    type:String
  },
  access_level:{
    type:Number,
    required:true,
    min:1,
    max:5,
  },
  confirmationCode: {
    type: String,
    allowNull: true,
    defaultValue: "null",
  },
  isConfirmed: {
    type: Boolean,
    allowNull: false,
    defaultValue: false,
  },
  created_at:{
    type:Date,
    default:Date.now,
  },
  updated_at:{
    type:Date,
    default:Date.now,
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
