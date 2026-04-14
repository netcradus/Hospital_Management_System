import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
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

export default mongoose.model("Appointment", appointmentSchema);

