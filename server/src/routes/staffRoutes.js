import { Router } from "express";
import controller from "../controllers/staffController.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = Router();

router.get("/", requirePermission("receptionist", "view"), controller.list);
router.post("/", requirePermission("receptionist", "create"), controller.create);
router.get("/:id", requirePermission("receptionist", "view"), controller.getById);
router.put("/:id", requirePermission("receptionist", "edit"), controller.update);
router.delete("/:id", requirePermission("receptionist", "delete"), controller.remove);

export default router;

