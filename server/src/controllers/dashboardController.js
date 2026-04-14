import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/responseHandler.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import Billing from "../models/Billing.js";

export const getAdminDashboard = asyncHandler(async (_req, res) => {
  const [patients, doctors, appointments, billing] = await Promise.all([
    Patient.countDocuments(),
    Doctor.countDocuments(),
    Appointment.countDocuments(),
    Billing.aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
  ]);

  sendSuccess(res, "Dashboard data fetched successfully", {
    stats: {
      patients,
      doctors,
      appointments,
      revenue: billing[0]?.total || 0,
    },
  });
});

