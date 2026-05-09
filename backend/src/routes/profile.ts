import { Router, type IRouter } from "express";
import { getProfile, changePassword, getVotingHistory } from "../controllers/profile.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router: IRouter = Router();

router.get("/profile", requireAuth, getProfile);
router.post("/profile/change-password", requireAuth, changePassword);
router.get("/profile/voting-history", requireAuth, requireRole("student"), getVotingHistory);

export default router;
