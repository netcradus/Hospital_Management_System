import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: String,
    dob: Date,
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    bloodType: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    allergies: [String],
    currentMedications: [String],
    medicalHistory: String,
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
    insurance: {
      provider: String,
      policyNumber: String,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Patient", patientSchema);

