import { Router, type IRouter } from "express";
import { getSchools, getHostels, getPositions } from "../controllers/catalog.controller";

const router: IRouter = Router();

router.get("/catalog/schools", getSchools);
router.get("/catalog/hostels", getHostels);
router.get("/catalog/positions", getPositions);

export default router;
