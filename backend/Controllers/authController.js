const { registerUser ,loginUser,logoutUser,confirmEmail,forgotPassword,resetPassword} = require('../Services/authService');
const registerController = async (req, res) => {
  try {
    const { email, password, last_name, first_name, personal_number,access_level } = req.body;

    const { user, token } = await registerUser({
      email,
      password,
      last_name,
      first_name,
      personal_number,
      access_level,
    });
    const cookieOptions = {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    };
    res.cookie("jwt", token, cookieOptions);

    res.status(201).json({
      success: true,
      user,
      message: "Please confirm/verify your email.",
    });
  } catch (err) {
    if (err.message === "User already exists with this email") {
      return res.status(400).json({ error: err.message });
    } else if (err.message === "Error hashing password" || err.message === "Error generating token") {
      return res.status(500).json({ error: err.message });
    } else {
      console.log("err",err);
      return res.status(500).json({ error:err.message });
    }
  }
};
const loginController = async (req, res) => {
  try {
    const email = String(req.body.email);
    const password = String(req.body.password);
    const rememberMe = req.body.rememberMe === 'true';
    const { user, token } = await loginUser(email, password, rememberMe);
    const cookieOptions = {
      httpOnly: true,
      secure: false, // Set to true if using HTTPS
      sameSite: 'strict',
      path: '/',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 1 * 60 * 60 * 1000,
    };

    res.cookie("jwt", token, cookieOptions);
    console.log("Cookie set:", res.getHeaders()['set-cookie']); // Log the cookie being set

    res.status(200).json({
      success: true,
      user,
      token,
      message: 'Login successful',
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(400).json({ error: error.message });
  }
};
async function confirmEmailController(req, res) {
  const { confirmationCode } = req.params;
  try {
    const result = await confirmEmail(confirmationCode);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

async function forgotPasswordController(req, res) {
  const { email } = req.body;
  try {
    const { token, id } = await forgotPassword(email);
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ msg: "Verify with the link", token, id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function resetPasswordController(req, res) {
  const { id, token } = req.params;
  const { password } = req.body;
  try {
    const result = await resetPassword(id, token, password);
    res.status(200).json(result);
  } catch (error) {
    console.log("error",error)
    res.status(400).json({ error: error.message });
  }
}

const logoutController = async (req, res)=>{
    try{
      
      const logoutSuccess = await logoutUser();

        // If logout fails, throw an error to stop further processing
        if (!logoutSuccess) {
            throw new Error('Logout failed due to an internal error.');
        }
      res.clearCookie('jwt', { path: '/' });

      res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ success: false, message: 'Logout failed' });
  }
    
}
module.exports = { 
  registerController,
  loginController ,
  logoutController,
  confirmEmailController,
  forgotPasswordController,
  resetPasswordController
};

