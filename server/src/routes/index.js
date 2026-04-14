import { Router } from "express";
import authRoutes from "./authRoutes.js";
import patientRoutes from "./patientRoutes.js";
import doctorRoutes from "./doctorRoutes.js";
import appointmentRoutes from "./appointmentRoutes.js";
import billingRoutes from "./billingRoutes.js";
import departmentRoutes from "./departmentRoutes.js";
import staffRoutes from "./staffRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/patients", authMiddleware, patientRoutes);
router.use("/doctors", authMiddleware, doctorRoutes);
router.use("/appointments", authMiddleware, appointmentRoutes);
router.use("/billing", authMiddleware, billingRoutes);
router.use("/departments", authMiddleware, departmentRoutes);
router.use("/staff", authMiddleware, staffRoutes);
router.use("/dashboard", authMiddleware, dashboardRoutes);

export default router;

