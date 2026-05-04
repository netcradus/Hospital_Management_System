import { Router } from "express";
import controller from "../controllers/doctorController.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = Router();

router.get("/", requirePermission("doctors", "view"), controller.list);
router.post("/", requirePermission("doctors", "create"), controller.create);
router.get("/:id", requirePermission("doctors", "view"), controller.getById);
router.put("/:id", requirePermission("doctors", "edit"), controller.update);
router.delete("/:id", requirePermission("doctors", "delete"), controller.remove);

export default router;

