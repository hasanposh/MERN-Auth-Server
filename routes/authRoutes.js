import express from "express";
import {
  isAuthenticated,
  login,
  logout,
  register,
  resetPassword,
  sendResetOTP,
  sendVerifyOTP,
  verifyEmail,
} from "../controllers/authController.js";
import { userAuth } from "../middleware/userAuth.js";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.post("/send-verify-otp", userAuth, sendVerifyOTP);
authRouter.post("/verify-account", userAuth, verifyEmail);
authRouter.post("/is-auth", userAuth, isAuthenticated);
authRouter.post("/send-reset-otp", userAuth, sendResetOTP);
authRouter.post("/reset-password", userAuth, resetPassword);

export default authRouter;
