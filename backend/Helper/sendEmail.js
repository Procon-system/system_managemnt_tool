const nodemailer = require("nodemailer");
require('dotenv').config();
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USERNAME,
    pass: process.env.GMAIL_PASSWORD,
  },
});
exports.sendConfirmationEmail = async (email, confirmationCode, username) => {
  const confirmationLink = `http://localhost:3000/confirm-email/${confirmationCode}`;  // Construct the confirmation URL with the confirmationCode

  const mailOptions = {
    from: `Management Team <${process.env.GMAIL_USERNAME}>`,
    to: email,
    subject: "Account Confirmation",
    text: `Hey ${username},\n\nWe received a request to sign in to your account, but we didn't recognize the device. To complete the sign-in, click the link below to confirm your email address and finish the process.\n\nConfirmation link: ${confirmationLink}\n\nThanks,\nManagement Team`,
    html: `Hey ${username},<br><br>We received a request to sign in to your account, but we didn't recognize the device. To complete the sign-in, click the link below to confirm your email address and finish the process.<br><br>
           <a href="${confirmationLink}" style="font-size: 18px; color: #007bff; text-decoration: none;">Confirm Your Email</a><br><br>Thanks,<br>Management Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    throw new Error("Failed to send confirmation email");
  }
};


exports.sendWelcomeEmail = async (email, username) => {
  const mailOptions = {
    from: `Management Team <${process.env.GMAIL_USERNAME}>`,
    to: email,
    subject: "Welcome to Management Platform",
    text: `Welcome ${username},<br><br>You’ve just opened an account and are set to begin as a user.<br><br>Thanks,<br>Management Team`,
    html: `Welcome to our website ${username},<br><br>You have just opened an account and are set to sign in to your account.
        <br><br>Thanks,<br>Management Team`,
  };

  await transporter.sendMail(mailOptions);
};

exports.sendRestPasswordLink = async (email, id, token) => {
  const mailOptions = {
    from: `Management Team <${process.env.GMAIL_USERNAME}>`,
    to: email,
    subject: 'Reset Password Link',
    text: `To reset your password, please click the following link: http://localhost:3000/reset-password/${id}/${token}`
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Password reset email sent:", info.response);
    }
  });
};