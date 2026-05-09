import { Router, type IRouter } from "express";
import {
  getDashboard,
  getAdminPolls,
  createPoll,
  deletePoll,
  lockPoll,
  getUsers,
  approveUser,
  disableUser,
  promoteUser,
  getAdminCandidates,
  addCandidate,
  approveCandidate,
  rejectCandidate,
  getReports,
  getAuditLog,
} from "../controllers/admin.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router: IRouter = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/admin/dashboard", getDashboard);
router.get("/admin/polls", getAdminPolls);
router.post("/admin/polls", createPoll);
router.delete("/admin/polls/:pollId", deletePoll);
router.post("/admin/polls/:pollId/lock", lockPoll);
router.get("/admin/users", getUsers);
router.post("/admin/users/:userId/approve", approveUser);
router.post("/admin/users/:userId/disable", disableUser);
router.post("/admin/users/:userId/promote", promoteUser);
router.get("/admin/candidates", getAdminCandidates);
router.post("/admin/candidates", addCandidate);
router.post("/admin/candidates/:candidateId/approve", approveCandidate);
router.post("/admin/candidates/:candidateId/reject", rejectCandidate);
router.get("/admin/reports", getReports);
router.get("/admin/audit", getAuditLog);

export default router;
