
const {
  createUser,
  findUserByEmail,
  findUserByConfirmationCode,
  updateUser,
} = require('../Services/authService');
const generateToken = require('../Middleware/generateToken');
const hashPassword = require('../Middleware/hashPassword');
const bcrypt = require('bcryptjs');
const {
  sendConfirmationEmail,
  sendWelcomeEmail,
  sendRestPasswordLink,
} = require('../Helper/sendEmail');

const registerController = async (req, res) => {
  try {
    const newUser = await createUser(req.body);
    // await sendConfirmationEmail(newUser.email, newUser.confirmationCode, newUser.first_name);
res.status(201).json({
        success: true,
        user:newUser,
        message: "User registered successfully. Please verify the email.",
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
    const { email, password, rememberMe } = req.body;
    const user = await findUserByEmail(email);
    if (!user) throw new Error('User not found.');

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) throw new Error('Invalid credentials.');

    const tokenExpiry = rememberMe ? '30d' : '1h';
    const token = await generateToken({ id: user._id, access_level: user.access_level }, tokenExpiry);

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000,
    });

    res.status(200).json({ success: true, token, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const confirmEmailController = async (req, res) => {
  try {
    const { confirmationCode } = req.params;
    const user = await findUserByConfirmationCode(confirmationCode);
    if (!user) throw new Error('Invalid confirmation code.');

    await updateUser(user._id, { isConfirmed: true, confirmationCode: null });
    await sendWelcomeEmail(user.email, user.first_name);
    res.status(200).json({ success: true, message: 'Email confirmed successfully.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const forgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await findUserByEmail(email);
    if (!user) throw new Error('User not found.');

    const token = await generateToken({ id: user._id, access_level: user.access_level });
    await sendRestPasswordLink(user.email, token);
    res.status(200).json({ success: true, message: 'Password reset link sent.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const resetPasswordController = async (req, res) => {
  try {
    const { id, token } = req.params;
    const { password } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_TOKEN_KEY);
    if (!decoded || decoded.id !== id) throw new Error('Invalid token.');

    const hashedPassword = await hashPassword(password);
    await updateUser(id, { password: hashedPassword });

    res.status(200).json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const logoutController = async (req, res) => {
  res.clearCookie('jwt', { path: '/' });
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

module.exports = {
  registerController,
  loginController,
  confirmEmailController,
  forgotPasswordController,
  resetPasswordController,
  logoutController,
};
