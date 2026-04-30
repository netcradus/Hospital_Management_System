import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createSubscription,
  getCurrent,
  getStatus,
  handleWebhook,
  listPlans,
  renewSubscription,
} from "../controllers/subscriptionController.js";

const router = Router();

router.get("/plans", listPlans);
router.post("/webhook", handleWebhook);
router.get("/current", authMiddleware, getCurrent);
router.get("/status", authMiddleware, getStatus);
router.post("/create", authMiddleware, createSubscription);
router.post("/renew", authMiddleware, renewSubscription);

export default router;
