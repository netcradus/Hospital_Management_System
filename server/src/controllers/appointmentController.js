import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import Department from "../models/Department.js";
import Patient from "../models/Patient.js";
import createCrudController from "./crudFactory.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendSuccess } from "../utils/responseHandler.js";

const baseCrud = createCrudController(Appointment, "Appointments", "patientId doctorId departmentId");

async function getAuthenticatedPatient(req) {
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

async function validateDoctorBelongsToDepartment(doctorId, departmentId, departmentName) {
  if (!doctorId) return;

  const doctor = await Doctor.findById(doctorId).populate("departmentId");
  if (!doctor) {
    throw new ApiError(400, "Selected doctor does not exist.");
  }

  let matches = false;

  if (departmentId) {
    const docDeptId = String(doctor.departmentId?._id || doctor.departmentId || "");
    if (docDeptId === String(departmentId)) {
      matches = true;
    }
  }

  if (!matches && (departmentName || departmentId)) {
    let targetName = String(departmentName || "").trim().toLowerCase();

    if (!targetName && departmentId) {
      const deptObj = await Department.findById(departmentId);
      if (deptObj) {
        targetName = String(deptObj.name || "").trim().toLowerCase();
      }
    }

    const docDeptName = String(doctor.departmentId?.name || "").trim().toLowerCase();
    const docSpecName = String(doctor.specialization || "").trim().toLowerCase();

    if (targetName && (docDeptName === targetName || docSpecName === targetName)) {
      matches = true;
    }
  }

  if ((departmentId || departmentName) && !matches) {
    throw new ApiError(400, "Selected doctor does not belong to the selected department.");
  }
}

const SLOT_CAPACITY = 5;

async function checkSlotAvailability(doctorId, appointmentDate, appointmentTime, excludeAppointmentId = null) {
  if (!doctorId || !appointmentDate || !appointmentTime) return;

  const targetDate = new Date(appointmentDate);
  const startDate = new Date(targetDate);
  startDate.setUTCHours(0, 0, 0, 0);

  const endDate = new Date(targetDate);
  endDate.setUTCHours(23, 59, 59, 999);

  const query = {
    doctorId,
    appointmentTime: String(appointmentTime).trim(),
    status: { $ne: "Cancelled" },
    appointmentDate: { $gte: startDate, $lte: endDate },
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  const count = await Appointment.countDocuments(query);
  if (count >= SLOT_CAPACITY) {
    throw new ApiError(400, "This time slot is full. Please select another slot.");
  }
}

export default {
  ...baseCrud,

  list: asyncHandler(async (req, res) => {
    const userRole = req.user?.workspaceRole || req.user?.role;
    let filter = {};

    if (userRole === "patient") {
      const patientDoc = await getAuthenticatedPatient(req);
      if (!patientDoc) {
        return sendSuccess(res, "Appointments fetched successfully", {
          items: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        });
      }
      filter.patientId = patientDoc._id;
    }

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 300);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Appointment.find(filter)
        .populate("patientId doctorId departmentId")
        .sort({ appointmentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Appointment.countDocuments(filter),
    ]);

    sendSuccess(res, "Appointments fetched successfully", {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }),

  getBookedSlots: asyncHandler(async (req, res) => {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return sendSuccess(res, "Booked slots fetched successfully", {
        capacity: 5,
        counts: {},
        fullSlots: [],
      });
    }

    const targetDate = new Date(date);
    const startDate = new Date(targetDate);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(targetDate);
    endDate.setUTCHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      doctorId,
      status: { $ne: "Cancelled" },
      appointmentDate: { $gte: startDate, $lte: endDate },
    }).select("appointmentTime");

    const counts = {};
    for (const appt of appointments) {
      const time = String(appt.appointmentTime || "").trim();
      if (time) {
        counts[time] = (counts[time] || 0) + 1;
      }
    }

    const fullSlots = Object.keys(counts).filter((time) => counts[time] >= 5);

    sendSuccess(res, "Booked slots fetched successfully", {
      capacity: 5,
      counts,
      fullSlots,
    });
  }),

  getByPatientId: asyncHandler(async (req, res) => {
    const userRole = req.user?.workspaceRole || req.user?.role;
    let { patientId } = req.params;

    if (userRole === "patient") {
      const patientDoc = await getAuthenticatedPatient(req);
      if (!patientDoc || String(patientDoc._id) !== String(patientId)) {
        throw new ApiError(403, "Access denied. You can only view your own appointments.");
      }
      patientId = patientDoc._id;
    }

    const items = await Appointment.find({ patientId })
      .populate("patientId doctorId departmentId")
      .sort({ appointmentDate: -1, createdAt: -1 });
    sendSuccess(res, "Patient appointments fetched successfully", items);
  }),

  getById: asyncHandler(async (req, res) => {
    const userRole = req.user?.workspaceRole || req.user?.role;
    const item = await Appointment.findById(req.params.id).populate("patientId doctorId departmentId");
    if (!item) {
      throw new ApiError(404, "Appointment not found");
    }

    if (userRole === "patient") {
      const patientDoc = await getAuthenticatedPatient(req);
      const itemPatientId = String(item.patientId?._id || item.patientId || "");
      if (!patientDoc || String(patientDoc._id) !== itemPatientId) {
        throw new ApiError(403, "Access denied.");
      }
    }

    sendSuccess(res, "Appointment fetched successfully", item);
  }),

  create: asyncHandler(async (req, res) => {
    let { patientId, doctorId, departmentId, department, appointmentDate, appointmentTime } = req.body;

    const userRole = req.user?.workspaceRole || req.user?.role;
    if (userRole === "patient" && req.user) {
      const patientDoc = await getAuthenticatedPatient(req);
      if (!patientDoc) {
        throw new ApiError(400, "Authenticated patient record not found.");
      }
      patientId = patientDoc._id;
    }

    await validateDoctorBelongsToDepartment(doctorId, departmentId, department);
    await checkSlotAvailability(doctorId, appointmentDate, appointmentTime);

    const appointmentData = {
      ...req.body,
      patientId,
    };

    const item = await Appointment.create(appointmentData);

    // Concurrency validation check after save
    const targetDate = new Date(appointmentDate);
    const startDate = new Date(targetDate);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setUTCHours(23, 59, 59, 999);

    const countAfter = await Appointment.countDocuments({
      doctorId,
      appointmentTime: String(appointmentTime).trim(),
      status: { $ne: "Cancelled" },
      appointmentDate: { $gte: startDate, $lte: endDate },
    });

    if (countAfter > SLOT_CAPACITY) {
      await Appointment.findByIdAndDelete(item._id);
      throw new ApiError(400, "This time slot is full. Please select another slot.");
    }

    const populated = await Appointment.findById(item._id).populate("patientId doctorId departmentId");
    sendSuccess(res, "Appointment created successfully", populated, 201);
  }),

  update: asyncHandler(async (req, res) => {
    const { doctorId, departmentId, department, appointmentDate, appointmentTime, status } = req.body;
    const existing = await Appointment.findById(req.params.id);

    if (!existing) {
      throw new ApiError(404, "Appointment not found");
    }

    const userRole = req.user?.workspaceRole || req.user?.role;
    if (userRole === "patient") {
      const patientDoc = await getAuthenticatedPatient(req);
      const existingPatientId = String(existing.patientId?._id || existing.patientId || "");
      if (!patientDoc || String(patientDoc._id) !== existingPatientId) {
        throw new ApiError(403, "Access denied. You can only update your own appointments.");
      }
    }

    const targetDoctor = doctorId || existing.doctorId;
    const targetDeptId = departmentId || existing.departmentId;
    const targetDeptName = department || existing.department;
    const targetDate = appointmentDate || existing.appointmentDate;
    const targetTime = appointmentTime || existing.appointmentTime;
    const targetStatus = status || existing.status;

    await validateDoctorBelongsToDepartment(targetDoctor, targetDeptId, targetDeptName);

    if (targetStatus !== "Cancelled") {
      await checkSlotAvailability(targetDoctor, targetDate, targetTime, req.params.id);
    }

    const item = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("patientId doctorId departmentId");

    sendSuccess(res, "Appointment updated successfully", item);
  }),

  remove: asyncHandler(async (req, res) => {
    const existing = await Appointment.findById(req.params.id);
    if (!existing) {
      throw new ApiError(404, "Appointment not found");
    }

    const userRole = req.user?.workspaceRole || req.user?.role;
    if (userRole === "patient") {
      const patientDoc = await getAuthenticatedPatient(req);
      const existingPatientId = String(existing.patientId?._id || existing.patientId || "");
      if (!patientDoc || String(patientDoc._id) !== existingPatientId) {
        throw new ApiError(403, "Access denied.");
      }
    }

    await Appointment.findByIdAndDelete(req.params.id);
    sendSuccess(res, "Appointment deleted successfully", existing);
  }),
};


