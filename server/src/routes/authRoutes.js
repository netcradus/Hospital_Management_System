import { Router } from "express";
import { login, logout, profile, register } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authMiddleware, profile);

export default router;
