import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    department: { type: String },
    appointmentDate: { type: Date, required: true },
    appointmentTime: { type: String, required: true },
    duration: { type: Number, default: 30 },
    reasonForVisit: String,
    notes: String,
    status: {
      type: String,
      enum: ["Scheduled", "In-Progress", "Completed", "Cancelled", "Rescheduled"],
      default: "Scheduled",
    },
  },
  { timestamps: true }
);

appointmentSchema.pre("save", async function (next) {
  if (this.appointmentId) {
    return next();
  }

  let attempts = 0;
  const maxAttempts = 10;

  while (!this.appointmentId && attempts < maxAttempts) {
    attempts++;
    const appointments = await mongoose.model("Appointment").find(
      { appointmentId: { $regex: /^A\d+$/i } },
      { appointmentId: 1 }
    ).lean();

    let maxNum = 0;
    for (const appt of appointments) {
      if (appt.appointmentId) {
        const num = parseInt(appt.appointmentId.replace(/^A/i, ""), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    const candidateId = `A${String(maxNum + 1).padStart(3, "0")}`;

    const existing = await mongoose.model("Appointment").findOne({ appointmentId: candidateId }).lean();
    if (!existing) {
      this.appointmentId = candidateId;
    }
  }

  if (!this.appointmentId) {
    return next(new Error("Failed to generate unique Appointment ID after multiple attempts"));
  }

  next();
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

export async function syncExistingAppointmentIds() {
  try {
    const unassignedAppointments = await Appointment.find({
      $or: [{ appointmentId: { $exists: false } }, { appointmentId: null }, { appointmentId: "" }],
    }).sort({ createdAt: 1, _id: 1 });

    if (unassignedAppointments.length === 0) return;

    const appointmentsWithId = await Appointment.find(
      { appointmentId: { $regex: /^A\d+$/i } },
      { appointmentId: 1 }
    ).lean();

    let maxNum = 0;
    for (const appt of appointmentsWithId) {
      if (appt.appointmentId) {
        const num = parseInt(appt.appointmentId.replace(/^A/i, ""), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    for (const appt of unassignedAppointments) {
      maxNum++;
      appt.appointmentId = `A${String(maxNum).padStart(3, "0")}`;
      await appt.save();
    }
  } catch (error) {
    console.error("Failed to sync existing appointment IDs:", error);
  }
}

export default Appointment;


