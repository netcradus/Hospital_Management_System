import ApiError from "../utils/ApiError.js";
import { checkPermission, resolveRole } from "../config/rbac.js";

export function requirePermission(module, action) {
  return (req, _res, next) => {
    const role = resolveRole(req.user);
    req.user.workspaceRole = role;

    if (!checkPermission(role, module, action)) {
      return next(new ApiError(403, `Access denied for ${module}:${action}`));
    }

    next();
  };
}

