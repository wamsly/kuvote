import { Router, type IRouter } from "express";
import {
  prefillRegistration,
  register,
  verifyOtp,
  resendOtp,
  login,
  adminLogin,
  forgotPassword,
  resetPassword,
  getMe,
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

router.get("/auth/prefill", prefillRegistration);
router.post("/auth/register", register);
router.post("/auth/verify-otp", verifyOtp);
router.post("/auth/resend-otp", resendOtp);
router.post("/auth/login", login);
router.post("/admin/login", adminLogin);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/reset-password", resetPassword);
router.get("/auth/me", requireAuth, getMe);

export default router;
