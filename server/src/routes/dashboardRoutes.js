import { Router } from "express";
import { getAdminDashboard } from "../controllers/dashboardController.js";

const router = Router();

router.get("/admin", getAdminDashboard);

export default router;

