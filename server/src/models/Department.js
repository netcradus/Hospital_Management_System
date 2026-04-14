import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: String,
    headDoctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    phone: String,
    email: String,
  },
  { timestamps: true }
);

export default mongoose.model("Department", departmentSchema);

