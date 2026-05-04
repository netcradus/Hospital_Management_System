import { Router } from "express";
import controller from "../controllers/appointmentController.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = Router();

router.get("/", requirePermission("appointments", "view"), controller.list);
router.post("/", requirePermission("appointments", "create"), controller.create);
router.get("/:id", requirePermission("appointments", "view"), controller.getById);
router.put("/:id", requirePermission("appointments", "edit"), controller.update);
router.delete("/:id", requirePermission("appointments", "delete"), controller.remove);

export default router;

