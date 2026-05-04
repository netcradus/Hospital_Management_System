import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/responseHandler.js";
import { signAccessToken, signRefreshToken } from "../config/jwt.js";
import { ensureUserSubscriptionScope } from "../services/subscriptionService.js";

function inferDemoRole(email = "") {
  const normalizedEmail = String(email).toLowerCase();

  if (normalizedEmail.includes("doctor") || normalizedEmail.includes("dr")) {
    return "doctor";
  }
  if (normalizedEmail.includes("admin")) {
    return "admin";
  }
  if (normalizedEmail.includes("staff") || normalizedEmail.includes("reception") || normalizedEmail.includes("lab")) {
    return "staff";
  }

  return "patient";
}

function mapRequestedRole(role = "") {
  if (role === "super_admin") {
    return "admin";
  }
  if (role === "receptionist" || role === "lab_staff") {
    return "staff";
  }
  return role || undefined;
}

function buildDemoName(email = "") {
  const seed = email.includes("@") ? email.split("@")[0] : email;
  const value = seed.replace(/[._-]+/g, " ").trim();
  return value ? value.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Demo User";
}

function buildAuthPayload(user) {
  const safeUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationKey: user.organizationKey,
  };

  return {
    user: safeUser,
    tokens: {
      accessToken: signAccessToken({ id: user._id, role: user.role }),
      refreshToken: signRefreshToken({ id: user._id, role: user.role }),
    },
  };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, organizationKey } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  const user = new User({ name, email, password, role, organizationKey });
  user.organizationKey = `user:${user._id}`;
  await user.save();
  sendSuccess(res, "Registration successful", buildAuthPayload(user), 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  if (process.env.AUTH_DEMO_MODE === "true") {
    const normalizedRole = mapRequestedRole(role) || inferDemoRole(email);
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name: buildDemoName(email),
        email,
        password: "demo-pass-123",
        role: normalizedRole,
      });
      user.organizationKey = `user:${user._id}`;
      await user.save();
    } else if (normalizedRole && user.role !== normalizedRole) {
      user.role = normalizedRole;
      await user.save();
    }

    await ensureUserSubscriptionScope(user);
    sendSuccess(res, "Demo login successful", buildAuthPayload(user));
    return;
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  await ensureUserSubscriptionScope(user);
  sendSuccess(res, "Login successful", buildAuthPayload(user));
});

export const profile = asyncHandler(async (req, res) => {
  sendSuccess(res, "Profile fetched", req.user);
});

export const logout = asyncHandler(async (_req, res) => {
  sendSuccess(res, "Logout successful", { loggedOut: true });
});
