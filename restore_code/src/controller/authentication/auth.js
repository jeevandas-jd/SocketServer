const User = require("../../models/authentication/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");


const { hashPassword, comparePassword } = require("../../utils/bcryptUtils");
const { generateToken, verifyToken } = require("../../utils/jwtUtils");
const { sendEmail } = require("../../utils/emailUtils");

// ---------- REGISTER ----------
exports.register = async (req, res) => {
  try {
    const { email, password, role } = req.body;



    // check if user exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password if manual registration
    const hashedPassword = password ? await hashPassword(password) : null;

    const user = await User.create({
      email,
      password: hashedPassword,
      role,
      isVerified: false,
      
    });

    // create verification token (short expiry)
    const verifyToken = generateToken(user);

    const verifyLink = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;

    await sendEmail(
      user.email,
      "Verify Your Email",
      `<p>Click <a href="${verifyLink}">here</a> to verify your account.</p>`
    );

    res.status(201).json({
      message: "User registered successfully. Please check your email to verify.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------- VERIFY EMAIL ----------
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(400).json({ message: "Invalid token" });

    user.isVerified = true;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

// ---------- LOGIN ----------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (!user.password) {
      return res.status(400).json({ message: "Use Google login for this account" });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email first" });
    }

    const token = generateToken(user);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------- FORGOT PASSWORD ----------
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const resetToken = generateToken(user);
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await sendEmail(
      user.email,
      "Password Reset",
      `<p>Click <a href="${resetLink}">here</a> to reset your password</p>`
    );

    res.json({ message: "Password reset link sent to your email" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------- RESET PASSWORD ----------
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(400).json({ message: "Invalid token" });

    user.password = await hashPassword(newPassword);
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

// ---------- GOOGLE OAUTH SUCCESS CALLBACK ----------
exports.googleAuthCallback = async (req, res) => {
  try {
    const user = req.user; // set by passport

    // check if profile is complete
    if (
      user.role === "pilot" &&
      (!user.studentID || !user.department || !user.vehicleNumber)
    ) {
      return res.redirect(`${process.env.CLIENT_URL}/complete-pilot-profile`);
    }

    if (
      user.role === "consumer" &&
      (!user.studentID || !user.department)
    ) {
      return res.redirect(`${process.env.CLIENT_URL}/complete-consumer-profile`);
    }

    // admin profile completeness can be handled separately

    // generate JWT for frontend
    const token = generateToken(user);

    res.redirect(`${process.env.CLIENT_URL}/dashboard?token=${token}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// get 