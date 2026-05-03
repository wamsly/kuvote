import { Router, type IRouter } from "express";
import { healthCheck } from "../controllers/health.controller";

const router: IRouter = Router();

router.get("/healthz", healthCheck);

export default router;
