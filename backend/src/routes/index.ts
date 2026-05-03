import { Router, type IRouter } from "express";
import healthRouter from "./health";
import catalogRouter from "./catalog";
import authRouter from "./auth";
import profileRouter from "./profile";
import pollsRouter from "./polls";
import candidatesRouter from "./candidates";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(catalogRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(pollsRouter);
router.use(candidatesRouter);
router.use(adminRouter);

export default router;
