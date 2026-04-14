import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "super_secret_key";

export function signAccessToken(payload) {
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRE || "15m",
  });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, secret, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRE || "7d",
  });
}

export function verifyToken(token) {
  return jwt.verify(token, secret);
}

