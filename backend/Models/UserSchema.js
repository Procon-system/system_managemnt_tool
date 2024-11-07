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

// Hash the password before saving
// userSchema.pre('save', async function (next) {
//   this.updated_at = Date.now();
//   if (!this.isModified('password')) return next();
//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });
// userSchema.pre('save', async function (next) {
//   this.updated_at = Date.now();
  
//   // Only hash the password if it’s new or has been modified
//   if (!this.isModified('password')) return next();

//   // Hash the password with bcrypt
//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });

// User Model
const User = mongoose.model('User', userSchema);

module.exports = User;
