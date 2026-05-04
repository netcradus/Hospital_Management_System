import { Router } from "express";
import controller from "../controllers/patientController.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = Router();

router.get("/", requirePermission("patients", "view"), controller.list);
router.post("/", requirePermission("patients", "create"), controller.create);
router.get("/:id", requirePermission("patients", "view"), controller.getById);
router.put("/:id", requirePermission("patients", "edit"), controller.update);
router.delete("/:id", requirePermission("patients", "delete"), controller.remove);

export default router;

