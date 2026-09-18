import mongoose from "mongoose";

const billingSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    serviceDescription: { type: String, required: true },
    amount: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    amountDue: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending", "Partially Paid"],
      default: "Pending",
    },
    paymentDate: Date,
    paymentMethod: String,
    transactionId: String,
    invoiceNumber: { type: String, unique: true, sparse: true },
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model("Billing", billingSchema);

