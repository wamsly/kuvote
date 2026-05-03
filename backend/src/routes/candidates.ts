import { Router, type IRouter } from "express";
import { applyCandidate, getMyApplications, endorseCandidate } from "../controllers/candidates.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router: IRouter = Router();

router.post("/candidates/apply", requireAuth, requireRole("student"), applyCandidate);
router.get("/candidates/my-applications", requireAuth, requireRole("student"), getMyApplications);
router.post("/candidates/:candidateId/endorse", requireAuth, requireRole("student"), endorseCandidate);

export default router;
