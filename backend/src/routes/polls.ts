import { Router, type IRouter } from "express";
import {
  getActivePublicPolls,
  getPolls,
  getPoll,
  castVote,
  getPollResults,
} from "../controllers/polls.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { requireFeeCleared } from "../middleware/feeStatus";

const router: IRouter = Router();

router.get("/polls/active/public", getActivePublicPolls);
router.get("/polls", requireAuth, getPolls);
router.get("/polls/:pollId", requireAuth, getPoll);
router.post("/polls/:pollId/vote", requireAuth, requireRole("student"), requireFeeCleared, castVote);
router.get("/polls/:pollId/results", requireAuth, getPollResults);

export default router;
