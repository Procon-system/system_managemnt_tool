const nodemailer = require("nodemailer");
require('dotenv').config();

const emailConfig = {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE !== 'false', 
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  fromName: process.env.EMAIL_FROM_NAME || 'Your Application',
  fromAddress: process.env.SMTP_USER, 
  frontendUrl: process.env.FRONTEND_URL, 
};


if (!emailConfig.host || !emailConfig.user || !emailConfig.pass || !emailConfig.frontendUrl) {
  console.error("FATAL ERROR: Missing required email environment variables.");
  console.error("Please ensure SMTP_HOST, SMTP_USER, SMTP_PASS, and FRONTEND_URL are set in your .env file.");
  // In a real application, you might want to exit if email is critical
  // process.exit(1); 
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, 
  port: process.env.SMTP_PORT, 
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, 
  },
  
});
// Create this once and reuse it everywhere for consistency.
const defaultFrom = `"${emailConfig.fromName}" <${emailConfig.fromAddress}>`;

exports.sendConfirmationEmail = async (email, confirmationCode, username, tenantId) => {
  console.log("confirmationCode" ,  confirmationCode)
  // coerce to a clean string safely
  const tenantIdStr =
    typeof tenantId === 'string'
      ? tenantId.trim()
      : tenantId?.toHexString?.()       // Mongo ObjectId
        ?? tenantId?.toString?.()        // fallback
        ?? String(tenantId);


  const confirmationLink =
    `${emailConfig.frontendUrl.replace(/\/+$/,'')}` +
    `/confirm-email/${encodeURIComponent(tenantIdStr)}/${encodeURIComponent(confirmationCode)}`;

  console.log('[sendConfirmationEmail] tenantId:', tenantId);
  console.log('[sendConfirmationEmail] tenantIdStr:', tenantIdStr);
  console.log('[sendConfirmationEmail] link:', confirmationLink);

  const mailOptions = {
    from: defaultFrom,
    to: email,
    subject: "Confirm Your Account",
    text: `Hey ${username || 'there'},\n\nConfirm: ${confirmationLink}\n\nThanks,\n${emailConfig.fromName}`,
    html: `
      <p>Hey ${username || 'there'},</p>
      <p>Please click the button below to confirm your email.</p>
      <p><a href="${confirmationLink}" style="font-size:16px;color:#fff;background:#007bff;padding:10px 20px;text-decoration:none;border-radius:5px;">Confirm Your Email</a></p>
      <p>If the button doesn’t work, copy and paste this link:<br><code>${confirmationLink}</code></p>
      <p>Thanks,<br>${emailConfig.fromName}</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};


/**
 * Sends a welcome email after an account is confirmed or created.
 */
exports.sendWelcomeEmail = async (email, username) => {
  const mailOptions = {
    from: defaultFrom, // Use the standardized "from" field
    to: email,
    subject: `Welcome to ${emailConfig.fromName}`,
    text: `Welcome ${username},\n\nYour account is now active. You can now sign in and get started.\n\nThanks,\nThe ${emailConfig.fromName} Team`,
    html: `
      <p>Welcome ${username},</p>
      <p>Your account is now active. You can now sign in and get started.</p>
      <p>Thanks,<br>The ${emailConfig.fromName} Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    // Don't throw an error here if it's not critical, to avoid breaking the user flow
  }
};
// Corrected function name and signature
exports.sendResetPasswordLink = async (email, token) => {
  const resetLink = `${emailConfig.frontendUrl}/reset-password/${token}`;

  const mailOptions = {
    from: defaultFrom, // Use the standardized "from" field
    to: email,
    subject: 'Your Password Reset Request',
    text: `You requested a password reset. Please click the following link to set a new password: ${resetLink}\n\nIf you did not request this, please ignore this email.`,
    html: `
      <p>You requested a password reset.</p>
      <p>Please click the link below to set a new password:</p>
      <a href="${resetLink}" style="font-size: 16px; color: #ffffff; background-color: #007bff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Your Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent:", info.response);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    // It's important to throw the error so the controller can catch it
    throw new Error("Failed to send password reset email.");
  }
};
