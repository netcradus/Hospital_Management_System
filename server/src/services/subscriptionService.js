import crypto from "crypto";
import Plan from "../models/Plan.js";
import Subscription from "../models/Subscription.js";

const DEFAULT_PLANS = [
  {
    name: "Basic",
    code: "basic",
    priceMonthly: 999,
    priceYearly: 9590,
    maxUsers: 10,
    trialDays: 7,
    features: ["Patient records", "Appointments", "Basic billing"],
  },
  {
    name: "Professional",
    code: "professional",
    priceMonthly: 1999,
    priceYearly: 19190,
    maxUsers: 50,
    trialDays: 14,
    features: [
      "Unlimited patient records",
      "All department dashboards",
      "Real-time analytics and reports",
      "Pharmacy and billing module",
      "Priority support",
      "Data export (PDF/Excel)",
    ],
  },
  {
    name: "Enterprise",
    code: "enterprise",
    priceMonthly: 4999,
    priceYearly: 47990,
    maxUsers: 500,
    trialDays: 30,
    features: ["Multi-branch support", "Advanced analytics", "Dedicated onboarding", "Priority webhook support"],
  },
];

export function resolveOrganizationKey(user) {
  return user?.organizationKey || (user?._id ? `user:${user._id}` : process.env.DEFAULT_ORGANIZATION_KEY || "medaxis-main");
}

export async function ensureUserSubscriptionScope(user) {
  if (!user?._id) {
    return resolveOrganizationKey(user);
  }

  const userScopedKey = `user:${user._id}`;
  if (user.organizationKey !== userScopedKey) {
    user.organizationKey = userScopedKey;
    await user.save();
  }

  return userScopedKey;
}

export async function migrateLegacySubscriptionForUser(user) {
  if (!user?._id) {
    return null;
  }

  const userScopedKey = `user:${user._id}`;
  const existingUserScopedSubscription = await Subscription.findOne({ organizationKey: userScopedKey }).sort({ endDate: -1, createdAt: -1 });
  if (existingUserScopedSubscription) {
    return existingUserScopedSubscription;
  }

  const legacyOrganizationKey = process.env.DEFAULT_ORGANIZATION_KEY || "medaxis-main";
  const legacySubscription = await Subscription.findOne({
    organizationKey: legacyOrganizationKey,
    createdByUserId: user._id,
  }).sort({ endDate: -1, createdAt: -1 });

  if (!legacySubscription) {
    return null;
  }

  legacySubscription.organizationKey = userScopedKey;
  await legacySubscription.save();
  return legacySubscription;
}

export async function ensureDefaultPlans() {
  await Promise.all(
    DEFAULT_PLANS.map((plan) =>
      Plan.findOneAndUpdate(
        { code: plan.code },
        { $setOnInsert: plan },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );

  return Plan.find({ isActive: true }).sort({ priceMonthly: 1 });
}

export async function getCurrentSubscription(organizationKey) {
  const subscription = await Subscription.findOne({ organizationKey })
    .populate("planId")
    .sort({ endDate: -1, createdAt: -1 });

  if (!subscription) {
    return null;
  }

  if (subscription.status === "active" && subscription.endDate <= new Date()) {
    subscription.status = "expired";
    await subscription.save();
  }

  return subscription;
}

export function buildSubscriptionStatus(subscription) {
  if (!subscription) {
    return {
      isActive: false,
      reason: "NO_SUBSCRIPTION",
      code: "NO_SUBSCRIPTION",
      plan: null,
      expiresAt: null,
      daysLeft: 0,
      lastPlan: null,
    };
  }

  const expiresAt = subscription.endDate;
  const isActive = subscription.status === "active" && expiresAt > new Date();
  const daysLeft = isActive ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000)) : 0;

  return {
    isActive,
    reason: isActive ? null : "SUBSCRIPTION_EXPIRED",
    code: isActive ? null : "SUBSCRIPTION_EXPIRED",
    plan: subscription.planId
      ? {
          id: subscription.planId._id,
          name: subscription.planId.name,
          code: subscription.planId.code,
          billingCycle: subscription.billingCycle,
          priceMonthly: subscription.planId.priceMonthly,
          priceYearly: subscription.planId.priceYearly,
          features: subscription.planId.features,
        }
      : null,
    expiresAt,
    daysLeft,
    lastPlan: subscription.planId?.name || null,
    startedAt: subscription.startDate,
    paymentReference: subscription.paymentReference || null,
    status: subscription.status,
  };
}

export function calculateSubscriptionEndDate(plan, billingCycle) {
  const startDate = new Date();
  const endDate = new Date(startDate);

  if (billingCycle === "yearly") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else if (billingCycle === "trial") {
    endDate.setDate(endDate.getDate() + Math.max(1, plan.trialDays || 7));
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  return { startDate, endDate };
}

export function createPaymentReference(prefix = "SUB") {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

export function verifyWebhookSignature(payload, signature) {
  const secret = process.env.SUBSCRIPTION_WEBHOOK_SECRET;
  if (!secret) {
    return true;
  }

  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature || "", "utf8"));
}
