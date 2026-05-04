import { Router } from "express";
import { getAdminDashboard } from "../controllers/dashboardController.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = Router();

router.get("/admin", requirePermission("dashboard", "view"), getAdminDashboard);

export default router;

