import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department Name is required"],
      unique: true,
      trim: true,
      minlength: [2, "Department Name must be at least 2 characters"],
      maxlength: [100, "Department Name cannot exceed 100 characters"],
      validate: {
        validator: function (v) {
          return Boolean(v && v.trim().length >= 2 && /^[A-Za-z\s]+$/.test(v.trim()));
        },
        message: "Department Name must contain only letters and spaces",
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      validate: {
        validator: function (v) {
          if (!v) return true;
          return v.trim().length > 0;
        },
        message: "Description cannot contain only whitespace",
      },
    },
    headDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v || v.trim() === "") return true;
          return /^[6-9]\d{9}$/.test(v.trim());
        },
        message: "Please enter a valid 10-digit phone number",
      },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          if (!v || v.trim() === "") return true;
          if (v.includes("..")) return false;
          return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v.trim());
        },
        message: "Please enter a valid email address",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Department", departmentSchema);


