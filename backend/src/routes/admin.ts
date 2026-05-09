import { Router, type IRouter } from "express";
import {
  getDashboard,
  getAdminPolls,
  createPoll,
  updatePoll,
  deletePoll,
  lockPoll,
  unlockPoll,
  openApplicationWindow,
  closeApplicationWindow,
  getApplicationSettings,
  getUsers,
  removeVoter,
  approveUser,
  disableUser,
  promoteUser,
  getAdminCandidates,
  addCandidate,
  approveCandidate,
  rejectCandidate,
  getReports,
  getElectionResultsReport,
  getVoterTurnoutReport,
  getCandidateReport,
  getVoterParticipationReport,
  getRejectedCandidatesReport,
  getAuditLog,
  resetAdminPassword,
} from "../controllers/admin.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router: IRouter = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/admin/dashboard", getDashboard);

router.get("/admin/polls", getAdminPolls);
router.post("/admin/polls", createPoll);
router.put("/admin/polls/:pollId", updatePoll);
router.delete("/admin/polls/:pollId", deletePoll);
router.post("/admin/polls/:pollId/lock", lockPoll);
router.post("/admin/polls/:pollId/unlock", unlockPoll);
router.post("/admin/polls/:pollId/open-applications", openApplicationWindow);
router.post("/admin/polls/:pollId/close-applications", closeApplicationWindow);
router.get("/admin/polls/:pollId/application-settings", getApplicationSettings);

router.get("/admin/users", getUsers);
router.delete("/admin/users/:userId", removeVoter);
router.post("/admin/users/:userId/approve", approveUser);
router.post("/admin/users/:userId/disable", disableUser);
router.post("/admin/users/:userId/promote", promoteUser);
router.post("/admin/users/:userId/reset-password", resetAdminPassword);

router.get("/admin/candidates", getAdminCandidates);
router.post("/admin/candidates", addCandidate);
router.post("/admin/candidates/:candidateId/approve", approveCandidate);
router.post("/admin/candidates/:candidateId/reject", rejectCandidate);

router.get("/admin/reports", getReports);
router.get("/admin/reports/election-results", getElectionResultsReport);
router.get("/admin/reports/voter-turnout", getVoterTurnoutReport);
router.get("/admin/reports/candidate-report", getCandidateReport);
router.get("/admin/reports/voter-participation", getVoterParticipationReport);
router.get("/admin/reports/rejected-candidates", getRejectedCandidatesReport);

router.get("/admin/audit", getAuditLog);

export default router;
