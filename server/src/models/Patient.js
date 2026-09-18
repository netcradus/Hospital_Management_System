import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
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

patientSchema.pre("save", async function (next) {
  if (this.patientId) {
    return next();
  }

  let attempts = 0;
  const maxAttempts = 10;

  while (!this.patientId && attempts < maxAttempts) {
    attempts++;
    const patients = await mongoose.model("Patient").find(
      { patientId: { $regex: /^P\d+$/i } },
      { patientId: 1 }
    ).lean();

    let maxNum = 0;
    for (const p of patients) {
      if (p.patientId) {
        const num = parseInt(p.patientId.replace(/^P/i, ""), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    const candidateId = `P${String(maxNum + 1).padStart(3, "0")}`;

    const existing = await mongoose.model("Patient").findOne({ patientId: candidateId }).lean();
    if (!existing) {
      this.patientId = candidateId;
    }
  }

  if (!this.patientId) {
    return next(new Error("Failed to generate unique Patient ID after multiple attempts"));
  }

  next();
});

const Patient = mongoose.model("Patient", patientSchema);

export async function syncExistingPatientIds() {
  try {
    const unassignedPatients = await Patient.find({
      $or: [{ patientId: { $exists: false } }, { patientId: null }, { patientId: "" }],
    }).sort({ createdAt: 1, _id: 1 });

    if (unassignedPatients.length === 0) return;

    const patientsWithId = await Patient.find(
      { patientId: { $regex: /^P\d+$/i } },
      { patientId: 1 }
    ).lean();

    let maxNum = 0;
    for (const p of patientsWithId) {
      if (p.patientId) {
        const num = parseInt(p.patientId.replace(/^P/i, ""), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    for (const patient of unassignedPatients) {
      maxNum++;
      patient.patientId = `P${String(maxNum).padStart(3, "0")}`;
      await patient.save();
    }
  } catch (error) {
    console.error("Failed to sync existing patient IDs:", error);
  }
}

export default Patient;


