import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { fullName, phoneNumber, emailAddress, password, location } = req.body;

  try {
    // Check if email already exists
    const emailExists = await User.findOne({ emailAddress });
    if (emailExists) {
      return res.status(400).json({ code: "email_exists" });
    }

    // Check if phone number already exists
    const phoneExists = await User.findOne({ phoneNumber });
    if (phoneExists) {
      return res.status(400).json({ code: "phone_exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      fullName,
      phoneNumber,
      emailAddress,
      password: hashedPassword,
      location,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        emailAddress: user.emailAddress,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ code: "invalid_user_data" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "server_error", message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    // Find user by email OR phone number
    const user = await User.findOne({
      $or: [
        { emailAddress: identifier.trim() },
        { phoneNumber: identifier.trim() }
      ]
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        fullName: user.fullName,
        emailAddress: user.emailAddress,
        phoneNumber: user.phoneNumber,
        location: user.location,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ code: "invalid_credentials" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "server_error", message: error.message });
  }
};

const sendResetEmail = async (email, resetUrl) => {
  // If email configuration is missing, we print to console and resolve.
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("\n=========================================");
    console.log("PASSWORD RESET EMAIL SIMULATION (LOCAL TESTING)");
    console.log(`To: ${email}`);
    console.log(`Reset Link: ${resetUrl}`);
    console.log("=========================================\n");
    return;
  }

  // Create standard transporter
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Smart Agriculture Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Smart Agriculture - Password Reset",
    html: `
      <h3>Password Reset Request</h3>
      <p>You requested a password reset for your Smart Agriculture Support System account.</p>
      <p>Please click the link below to reset your password. This link is valid for 1 hour.</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// @desc    Generate password reset token & email/log link
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  const { emailAddress } = req.body;

  try {
    const user = await User.findOne({ emailAddress: emailAddress.trim() });
    if (!user) {
      return res.status(404).json({ code: "email_not_found" });
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");

    // Set token expiration (1 hour)
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;

    await user.save();

    // Reset Link
    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;

    // Send email or log simulation link
    await sendResetEmail(user.emailAddress, resetUrl);

    res.json({ message: "Reset link sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "server_error", message: error.message });
  }
};

// @desc    Reset password using valid token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ code: "invalid_token" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "server_error", message: error.message });
  }
};

// @desc    OAuth Google login verification
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(400).json({ code: "invalid_oauth_token", message: data.error_description || "Invalid Google token" });
    }

    const { email, name, sub } = data;

    let user = await User.findOne({ emailAddress: email });

    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), salt);

      user = await User.create({
        fullName: name || "Google User",
        emailAddress: email,
        phoneNumber: `google-${sub}`,
        password: hashedPassword,
        location: "OAuth",
      });
    }

    res.json({
      _id: user._id,
      fullName: user.fullName,
      emailAddress: user.emailAddress,
      phoneNumber: user.phoneNumber,
      location: user.location,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ code: "server_error", message: error.message });
  }
};

// @desc    OAuth Facebook login verification
// @route   POST /api/auth/facebook
// @access  Public
export const facebookLogin = async (req, res) => {
  const { accessToken } = req.body;

  try {
    const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`);
    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(400).json({ code: "invalid_oauth_token", message: data.error?.message || "Invalid Facebook token" });
    }

    const { id, name, email } = data;
    const emailAddress = email || `facebook-${id}@facebook.com`;

    let user = await User.findOne({ emailAddress });

    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), salt);

      user = await User.create({
        fullName: name || "Facebook User",
        emailAddress,
        phoneNumber: `facebook-${id}`,
        password: hashedPassword,
        location: "OAuth",
      });
    }

    res.json({
      _id: user._id,
      fullName: user.fullName,
      emailAddress: user.emailAddress,
      phoneNumber: user.phoneNumber,
      location: user.location,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Facebook Auth Error:", error);
    res.status(500).json({ code: "server_error", message: error.message });
  }
};
