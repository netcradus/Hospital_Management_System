import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import createCrudController from "./crudFactory.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendSuccess } from "../utils/responseHandler.js";

const baseCrud = createCrudController(Patient, "Patients");

async function getAuthenticatedPatientDoc(req) {
  if (!req.user) return null;
  const userRole = req.user.workspaceRole || req.user.role;
  if (userRole !== "patient") return null;

  return await Patient.findOne({
    $or: [
      { userId: req.user._id },
      { email: String(req.user.email || "").toLowerCase() },
      { _id: req.user._id },
    ],
  });
}

async function getAuthenticatedDoctorDoc(req) {
  if (!req.user) return null;
  const userRole = req.user.workspaceRole || req.user.role;
  if (userRole !== "doctor") return null;

  return await Doctor.findOne({
    $or: [
      { userId: req.user._id },
      { email: String(req.user.email || "").toLowerCase() },
      { _id: req.user._id },
    ],
  });
}

export default {
  ...baseCrud,

  list: asyncHandler(async (req, res) => {
    const userRole = req.user?.workspaceRole || req.user?.role;
    if (userRole === "patient") {
      const patientDoc = await getAuthenticatedPatientDoc(req);
      const items = patientDoc ? [patientDoc] : [];
      return sendSuccess(res, "Patients fetched successfully", {
        items,
        pagination: {
          page: 1,
          limit: 10,
          total: items.length,
          totalPages: items.length ? 1 : 0,
        },
      });
    }

    if (userRole === "doctor") {
      const doctorDoc = await getAuthenticatedDoctorDoc(req);
      if (!doctorDoc) {
        return sendSuccess(res, "Patients fetched successfully", {
          items: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        });
      }

      const patientIds = await Appointment.distinct("patientId", { doctorId: doctorDoc._id });
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 300);
      const skip = (page - 1) * limit;

      const filter = { _id: { $in: patientIds } };

      const [items, total] = await Promise.all([
        Patient.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Patient.countDocuments(filter),
      ]);

      return sendSuccess(res, "Patients fetched successfully", {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    return baseCrud.list(req, res);
  }),

  getById: asyncHandler(async (req, res) => {
    const userRole = req.user?.workspaceRole || req.user?.role;
    if (userRole === "patient") {
      const patientDoc = await getAuthenticatedPatientDoc(req);
      if (!patientDoc || String(patientDoc._id) !== String(req.params.id)) {
        throw new ApiError(403, "Access denied. You can only view your own patient profile.");
      }
    }

    if (userRole === "doctor") {
      const doctorDoc = await getAuthenticatedDoctorDoc(req);
      if (!doctorDoc) {
        throw new ApiError(403, "Access denied.");
      }

      const hasAppointment = await Appointment.exists({
        doctorId: doctorDoc._id,
        patientId: req.params.id,
      });

      if (!hasAppointment) {
        throw new ApiError(403, "Access denied. You can only view patients assigned to you.");
      }
    }

    return baseCrud.getById(req, res);
  }),
};


