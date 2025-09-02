import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../model/userModel.js";
import transporter from "../config/nodemailer.js";

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new userModel({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    /**
     * // Email sending logic added here
     */

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Welcome to Our Service",
      text: `Hello ${user.name},\n\nThank you for registering at our service!\n\nBest regards,\nTeam`,
    };

    await transporter.sendMail(mailOptions);

    return res
      .status(201)
      .json({ success: true, message: "User registered successfully" });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({
      success: false,
      message: "Email and password fields are required",
    });
  }
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.json({ success: false, message: "Invalid password" });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ success: true, message: "Logged in successfully" });
  } catch (error) {
    req.json({ success: false, message: error.message });
  }
};

export const logout = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    req.json({ success: false, message: error.message });
  }
};

export const sendVerifyOTP = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await userModel.findById(userId);
    if (user.isAccountVerified) {
      return res.json({ success: false, message: "Account already verified" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Your Verification OTP",
      text: `Hello ${user.name},\n\nYour OTP for account verification is: ${otp}\nIt is valid for 10 minutes.\n\nBest regards,\nTeam`,
    };
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {}
};

export const verifyEmail = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (user.isAccountVerified) {
      return res.json({ success: false, message: "Account already verified" });
    }
    if (user.verifyOtp === "" || user.verifyOtp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }
    if (Date.now() > user.verifyOtpExpireAt) {
      return res.json({ success: false, message: "OTP has expired" });
    }
    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = 0;
    await user.save();
    res.json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
