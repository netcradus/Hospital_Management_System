import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    organizationKey: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
      index: true,
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly", "trial"],
      default: "monthly",
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true, index: true },
    paymentReference: { type: String, trim: true },
    paymentProvider: { type: String, trim: true, default: "manual" },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

subscriptionSchema.index({ organizationKey: 1, endDate: -1 });

export default mongoose.model("Subscription", subscriptionSchema);
