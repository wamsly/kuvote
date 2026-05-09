import { Router, type IRouter } from "express";
import {
  applyCandidate,
  getMyApplications,
  endorseCandidate,
  uploadCandidateDocument,
  getApplicationSettings,
} from "../controllers/candidates.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router: IRouter = Router();

router.post("/candidates/apply", requireAuth, requireRole("student"), applyCandidate);
router.get("/candidates/my-applications", requireAuth, requireRole("student"), getMyApplications);
router.post("/candidates/:candidateId/endorse", requireAuth, requireRole("student"), endorseCandidate);
router.post("/candidates/:candidateId/upload-document", requireAuth, requireRole("student"), uploadCandidateDocument);
router.get("/candidates/application-settings/:pollId", requireAuth, getApplicationSettings);

export default router;
