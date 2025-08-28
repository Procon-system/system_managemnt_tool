const {
  registerUser,
  registerAdminUser,
  loginUser,
  logoutUser,
  confirmEmail,
  forgotPassword,
  resetPassword
} = require('../Services/authService');
const { handleAdminRegistration } = require('../Services/adminRegistration');
const {
  sendConfirmationEmail,

} = require("../Helper/sendEmail");
const { getOrganizationDB } = require('../config/dbManager');

const PLAN_PRICES = {
  free: 0,
  basic: 10,
  pro: 25,
  enterprise: 100,
};

const adminRegistrationController = async (req, res) => {
  const formData = req.body;

  try {
    // 1. Basic Server-Side Validation
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      return res.status(400).json({ success: false, message: 'Missing required registration fields.' });
    }
    if (formData.account_type === 'organization' && !formData.organization_name) {
      return res.status(400).json({ success: false, message: 'Organization name is required for organization accounts.' });
    }
    if (!formData.subscription_plan) {
      return res.status(400).json({ success: false, message: 'A subscription plan must be selected.' });
    }

    // 2. PAYMENT LOGIC BYPASSED
    // ========================================================================
    // In the future, you will uncomment this section and integrate a payment provider.
    /*
    const plan = formData.subscription_plan;
    const price = PLAN_PRICES[plan];

    if (price === undefined) {
      return res.status(400).json({ success: false, message: 'Invalid subscription plan selected.' });
    }

    if (price > 0) {
      // For paid plans, payment details are required
      if (!formData.card_number || !formData.expiry || !formData.cvv) {
        return res.status(400).json({ success: false, message: 'Payment details are required for this plan.' });
      }
      // Process payment BEFORE creating the user in the database
      await processPayment({
          card_number: formData.card_number,
          expiry: formData.expiry,
          cvv: formData.cvv,
      }, price);
    }
    */
    // ========================================================================
    
    // 3. Directly proceed with registration
    console.log('Payment bypassed. Proceeding with user and organization creation...');
    const { user, organization ,token} = await handleAdminRegistration(formData);

    // 4. Send success response
    // Optionally, generate a JWT here to log the user in automatically
    res.status(201).json({
      success: true,
      message: 'Registration successful! Your account has been created.',
      data: { user, organization ,token}
    });

  } catch (err) {
    console.error("Public Registration Error:", err);
    
    // Check for specific, common errors like duplicates
    const isConflict = err.message.includes('already exists');
    if (isConflict) {
        return res.status(409).json({ success: false, message: err.message }); // 409 Conflict is more appropriate
    }

    // Generic error for everything else
    res.status(500).json({ 
      success: false,
      message: 'An internal server error occurred. Please try again later.'
    });
  }
};

const registerController = async (req, res) => {
  try {
    const tenantId = req.user.org_id;
    const {  User } = req.tenantModels;
    
    const { email, password, role = 'user',
      isConfirmed,
      isActive,
      payroll 
    } = req.body;
 // For monitors, auto‐fill a safe default name
 let first_name = req.body.first_name;
 let last_name  = req.body.last_name;
 let access_level = req.body.access_level 
 let personal_number=req.body.personal_number;
 if (role === 'monitor') {
   first_name = first_name || 'Monitor';
   last_name  = last_name  || 'Service';
   access_level = 4;
   personal_number = personal_number || Math.floor(1e9 + Math.random() * 9e9).toString();

 }
    const user = await registerUser({
      email,
      password,
      last_name,
      first_name,
      org_id: tenantId ,
      personal_number,
      access_level,
      role, 
      isConfirmed: isConfirmed || false, 
      isActive: isActive || true, 
      payroll: payroll 

    },tenantId,User);

 if (!user.isConfirmed) {
  await sendConfirmationEmail(
  user.email,
  user.confirmationCode,
  user.first_name || user.email,
  req.user.org_id?.toHexString?.() || req.user.org_id?.toString?.() || String(req.user.org_id)
  );
}
    res.status(201).json({
      success: true,
      data: user,
      message: "User registered successfully. Please check your email to confirm."
    });
  } catch (err) {
    console.error("Registration Error:", err);
    
    const statusCode = err.message.includes('already exists') ? 400 : 500;
    
    res.status(statusCode).json({ 
      success: false,
      message: err.message // Use 'message' instead of 'error'
    });
  }
};

const loginController = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    const result = await loginUser(email, password, rememberMe);

    res.cookie('jwt', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000,
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined
    });

    res.json({
      success: true,
      data: result.user,
      token: result.token,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error.message);

    const statusCode =
      error.message.includes('not found') ||
      error.message.includes('Incorrect') ||
      error.message.includes('locked')
        ? 401
        : 400;

    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
};

const confirmEmailController = async (req, res) => {
  try {
    const { tenantId, confirmationCode } = req.params;

    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Missing tenantId' });
    }
    if (!confirmationCode) {
      return res.status(400).json({ success: false, error: 'Missing confirmation code' });
    }

    const tenantDB = await getOrganizationDB(tenantId);
    if (!tenantDB) {
      return res.status(400).json({ success: false, error: 'Tenant not found' });
    }

    const User = tenantDB.models.get('User');
    if (!User) {
      return res.status(500).json({ success: false, error: 'User model not initialized for tenant' });
    }

    const result = await confirmEmail(confirmationCode, User);
    console.log("result", result)
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const forgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await forgotPassword(email);
    
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
};

const resetPasswordController = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    const result = await resetPassword(token, password);

    // Set cookie with new token
    res.cookie('jwt', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 1000, // 1 hour
      sameSite: 'strict',
      path: '/'
    });

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
};

const logoutController = async (req, res) => {
  try {
    // Clear the JWT cookie
    res.clearCookie('jwt', { 
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Logout failed' 
    });
  }
};

module.exports = {
  registerController,
  adminRegistrationController,
  loginController,
  logoutController,
  confirmEmailController,
  forgotPasswordController,
  resetPasswordController
};
