import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/responseHandler.js";
import Plan from "../models/Plan.js";
import Subscription from "../models/Subscription.js";
import {
  buildSubscriptionStatus,
  calculateSubscriptionEndDate,
  createPaymentReference,
  ensureUserSubscriptionScope,
  ensureDefaultPlans,
  getCurrentSubscription,
  migrateLegacySubscriptionForUser,
  resolveOrganizationKey,
  verifyWebhookSignature,
} from "../services/subscriptionService.js";

export const listPlans = asyncHandler(async (_req, res) => {
  const plans = await ensureDefaultPlans();
  sendSuccess(res, "Subscription plans fetched", plans);
});

export const getCurrent = asyncHandler(async (req, res) => {
  await ensureDefaultPlans();
  await ensureUserSubscriptionScope(req.user);
  await migrateLegacySubscriptionForUser(req.user);
  const subscription = await getCurrentSubscription(resolveOrganizationKey(req.user));
  sendSuccess(res, "Current subscription fetched", subscription);
});

export const getStatus = asyncHandler(async (req, res) => {
  await ensureDefaultPlans();
  await ensureUserSubscriptionScope(req.user);
  await migrateLegacySubscriptionForUser(req.user);
  const subscription = await getCurrentSubscription(resolveOrganizationKey(req.user));
  sendSuccess(res, "Subscription status fetched", buildSubscriptionStatus(subscription));
});

async function upsertSubscription({ req, res, mode }) {
  const { planId, billingCycle = "monthly", paymentReference, paymentProvider, cardholderName } = req.body;

  if (!planId) {
    throw new ApiError(400, "Plan is required");
  }

  const plan = await Plan.findById(planId);
  if (!plan || !plan.isActive) {
    throw new ApiError(404, "Subscription plan not found");
  }

  await ensureUserSubscriptionScope(req.user);
  await migrateLegacySubscriptionForUser(req.user);
  const organizationKey = resolveOrganizationKey(req.user);
  const currentSubscription = await getCurrentSubscription(organizationKey);

  if (mode === "create" && currentSubscription && buildSubscriptionStatus(currentSubscription).isActive) {
    throw new ApiError(409, "An active subscription already exists for this hospital");
  }

  if (mode === "renew" && !currentSubscription) {
    throw new ApiError(404, "No subscription found to renew");
  }

  const { startDate, endDate } = calculateSubscriptionEndDate(plan, billingCycle);

  if (currentSubscription && currentSubscription.status === "active") {
    currentSubscription.status = "cancelled";
    await currentSubscription.save();
  }

  const subscription = await Subscription.create({
    organizationKey,
    planId: plan._id,
    status: "active",
    billingCycle,
    startDate,
    endDate,
    paymentReference: paymentReference || createPaymentReference(mode === "renew" ? "REN" : "SUB"),
    paymentProvider: paymentProvider || "manual",
    createdByUserId: req.user._id,
    metadata: {
      cardholderName: cardholderName || null,
      mode,
    },
  });

  await subscription.populate("planId");
  sendSuccess(res, mode === "renew" ? "Subscription renewed successfully" : "Subscription created successfully", {
    subscription,
    status: buildSubscriptionStatus(subscription),
  }, 201);
}

export const createSubscription = asyncHandler(async (req, res) => {
  await ensureDefaultPlans();
  return upsertSubscription({ req, res, mode: "create" });
});

export const renewSubscription = asyncHandler(async (req, res) => {
  await ensureDefaultPlans();
  return upsertSubscription({ req, res, mode: "renew" });
});

export const handleWebhook = asyncHandler(async (req, res) => {
  const rawPayload = JSON.stringify(req.body || {});
  const signature = req.headers["x-subscription-signature"];

  if (!verifyWebhookSignature(rawPayload, signature)) {
    throw new ApiError(401, "Invalid webhook signature");
  }

  const { organizationKey, planCode, billingCycle = "monthly", paymentReference, status = "paid" } = req.body || {};

  if (!organizationKey || !planCode) {
    throw new ApiError(400, "organizationKey and planCode are required");
  }

  await ensureDefaultPlans();
  const plan = await Plan.findOne({ code: planCode });
  if (!plan) {
    throw new ApiError(404, "Subscription plan not found");
  }

  if (status !== "paid") {
    sendSuccess(res, "Webhook acknowledged", { acknowledged: true, updated: false });
    return;
  }

  const existing = await getCurrentSubscription(organizationKey);
  if (existing?.status === "active") {
    existing.status = "cancelled";
    await existing.save();
  }

  const { startDate, endDate } = calculateSubscriptionEndDate(plan, billingCycle);
  const subscription = await Subscription.create({
    organizationKey,
    planId: plan._id,
    status: "active",
    billingCycle,
    startDate,
    endDate,
    paymentReference: paymentReference || createPaymentReference("WH"),
    paymentProvider: "webhook",
    metadata: req.body,
  });

  await subscription.populate("planId");
  sendSuccess(res, "Webhook processed", {
    acknowledged: true,
    updated: true,
    status: buildSubscriptionStatus(subscription),
  });
});
