import { Router } from "express";
import controller from "../controllers/departmentController.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = Router();

router.get("/", requirePermission("departments", "view"), controller.list);
router.post("/", requirePermission("departments", "create"), controller.create);
router.get("/:id", requirePermission("departments", "view"), controller.getById);
router.put("/:id", requirePermission("departments", "edit"), controller.update);
router.delete("/:id", requirePermission("departments", "delete"), controller.remove);

export default router;

