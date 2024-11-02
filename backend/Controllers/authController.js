const { registerUser ,loginUser,logoutUser} = require('../Services/authService');
const registerController = async (req, res) => {
  try {
    const { email, password, last_name, first_name, personal_number, working_group, access_level } = req.body;

    const { user, token } = await registerUser({
      email,
      password,
      last_name,
      first_name,
      personal_number,
      working_group,
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
      token,
      message: "User registered successfully.",
    });
  } catch (err) {
    if (err.message === "User already exists with this email") {
      return res.status(400).json({ error: err.message });
    } else if (err.message === "Error hashing password" || err.message === "Error generating token") {
      return res.status(500).json({ error: err.message });
    } else {
      console.log("err",err);
      return res.status(500).json({ error: "An error occurred while registering the user" });
    }
  }
};
const loginController = async (req, res) => {
  try {
    const email = String(req.body.email);
    const password = String(req.body.password);
    const rememberMe = req.body.rememberMe === 'true';
    
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("Remember Me:", rememberMe);

    const { user, token } = await loginUser(email, password, rememberMe);
    
    console.log("User:", user);
    console.log("Token:", token);

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
module.exports = { registerController,loginController ,logoutController};

