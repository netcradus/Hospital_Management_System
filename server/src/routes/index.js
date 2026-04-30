import { Router } from "express";
import authRoutes from "./authRoutes.js";
import patientRoutes from "./patientRoutes.js";
import doctorRoutes from "./doctorRoutes.js";
import appointmentRoutes from "./appointmentRoutes.js";
import billingRoutes from "./billingRoutes.js";
import departmentRoutes from "./departmentRoutes.js";
import staffRoutes from "./staffRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import subscriptionRoutes from "./subscriptionRoutes.js";
import authMiddleware from "../middleware/authMiddleware.js";
import checkSubscription from "../middleware/checkSubscription.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/subscription", subscriptionRoutes);
router.use("/patients", authMiddleware, checkSubscription, patientRoutes);
router.use("/doctors", authMiddleware, checkSubscription, doctorRoutes);
router.use("/appointments", authMiddleware, checkSubscription, appointmentRoutes);
router.use("/billing", authMiddleware, checkSubscription, billingRoutes);
router.use("/departments", authMiddleware, checkSubscription, departmentRoutes);
router.use("/staff", authMiddleware, checkSubscription, staffRoutes);
router.use("/dashboard", authMiddleware, checkSubscription, dashboardRoutes);

export default router;
