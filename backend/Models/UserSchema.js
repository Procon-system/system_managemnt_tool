
const UserModel = {
  _id: '',                   // Unique identifier for the user
  type: 'user',              // Type to distinguish user documents
  email: '',                 // Required: User email
  password: '',              // Required: Hashed password
  first_name: '',            // Required: First name
  last_name: '',             // Required: Last name
  personal_number: '',       // Required: Unique personal number
  access_level: 1,           // Required: Access level (1-5 scale)
  confirmationCode: null,    // Email confirmation code
  isConfirmed: false,        // Email confirmation status
  created_at: '',            // Timestamp when the user is created
  updated_at: '',            // Timestamp when the user is updated
};

module.exports = UserModel;
