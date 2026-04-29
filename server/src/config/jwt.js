import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "super_secret_key_change_in_production";

if (process.env.NODE_ENV === "production" && secret.includes("super_secret_key")) {
  console.warn("WARNING: Using default JWT secret in production! Set JWT_SECRET environment variable.");
}

export function signAccessToken(payload) {
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRE || "8h",
  });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, secret, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRE || "7d",
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token has expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid token");
    }
    throw error;
  }
}
