import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/responseHandler.js";
import { signAccessToken, signRefreshToken } from "../config/jwt.js";
import { ensureUserSubscriptionScope } from "../services/subscriptionService.js";

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
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
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
