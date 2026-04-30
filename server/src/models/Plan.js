import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    priceMonthly: { type: Number, required: true, min: 0 },
    priceYearly: { type: Number, required: true, min: 0 },
    maxUsers: { type: Number, default: 1 },
    trialDays: { type: Number, default: 0 },
    features: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Plan", planSchema);
