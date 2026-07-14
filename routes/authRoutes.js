import express from "express";
import { registerUser, authUser, forgotPassword, resetPassword, googleLogin, facebookLogin, getUserProfile } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", authUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/google", googleLogin);
router.post("/facebook", facebookLogin);
router.get("/profile/:id", getUserProfile);

export default router;
