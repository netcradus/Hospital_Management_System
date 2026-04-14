import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: String,
    specialization: { type: String, required: true },
    qualifications: [String],
    licenseNumber: { type: String, required: true, unique: true },
    yearsExperience: Number,
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    consultationFee: Number,
    availableSlots: [String],
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Doctor", doctorSchema);

