import { Router } from "express";
import controller from "../controllers/billingController.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = Router();

router.get("/", requirePermission("billing", "view"), controller.list);
router.post("/", requirePermission("billing", "create"), controller.create);
router.get("/:id", requirePermission("billing", "view"), controller.getById);
router.put("/:id", requirePermission("billing", "edit"), controller.update);
router.delete("/:id", requirePermission("billing", "delete"), controller.remove);

export default router;

