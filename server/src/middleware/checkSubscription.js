import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { buildSubscriptionStatus, getCurrentSubscription, resolveOrganizationKey } from "../services/subscriptionService.js";

const checkSubscription = asyncHandler(async (req, _res, next) => {
  const organizationKey = resolveOrganizationKey(req.user);
  const subscription = await getCurrentSubscription(organizationKey);
  const status = buildSubscriptionStatus(subscription);

  req.subscription = status;

  if (!status.isActive) {
    throw new ApiError(403, status.reason === "NO_SUBSCRIPTION" ? "An active subscription is required to access MediCare HMS." : "Your subscription has expired. Please renew to continue using MediCare HMS.", {
      error: "SUBSCRIPTION_REQUIRED",
      code: status.code,
      data: status,
    });
  }

  next();
});

export default checkSubscription;
