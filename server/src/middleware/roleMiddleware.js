import ApiError from "../utils/ApiError.js";

export default function roleMiddleware(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, "Access denied"));
    }

    next();
  };
}

