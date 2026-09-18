import Billing from "../models/Billing.js";
import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import createCrudController from "./crudFactory.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendSuccess } from "../utils/responseHandler.js";
import mongoose from "mongoose";

const baseCrud = createCrudController(Billing, "Billing", "patientId doctorId appointmentId");

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

async function validateInvoiceData(patientId, appointmentId, doctorId) {
  if (appointmentId) {
    const isObjId = mongoose.Types.ObjectId.isValid(appointmentId);
    const appointment = await Appointment.findOne({
      $or: [
        ...(isObjId ? [{ _id: appointmentId }] : []),
        { appointmentId: appointmentId },
      ],
    });

    if (!appointment) {
      throw new ApiError(400, "Selected appointment not found.");
    }

    if (String(appointment.patientId) !== String(patientId)) {
      throw new ApiError(400, "The selected appointment does not belong to the selected patient.");
    }

    if (doctorId && String(appointment.doctorId) !== String(doctorId)) {
      throw new ApiError(400, "The selected doctor does not match the patient's appointment.");
    }
  }
}

function formatInvoiceDoc(doc) {
  if (!doc) return doc;
  const item = doc.toObject ? doc.toObject() : doc;
  const total = Number(item.totalAmount || 0);
  let paid = Number(item.amountPaid || 0);
  if (item.amountPaid === undefined || item.amountPaid === null) {
    paid = item.paymentStatus === "Paid" ? total : 0;
  }
  const due = Math.max(0, total - paid);

  return {
    ...item,
    amountPaid: paid,
    amountDue: due,
  };
}

export default {
  ...baseCrud,

  list: asyncHandler(async (req, res) => {
    const userRole = req.user?.workspaceRole || req.user?.role;
    let filter = {};
    if (userRole === "patient") {
      const patientDoc = await getAuthenticatedPatientDoc(req);
      if (!patientDoc) {
        return sendSuccess(res, "Billing fetched successfully", {
          items: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        });
      }
      filter.patientId = patientDoc._id;
    }

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 200);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Billing.find(filter).populate("patientId doctorId appointmentId").sort({ createdAt: -1 }).skip(skip).limit(limit),
      Billing.countDocuments(filter),
    ]);

    const formattedItems = items.map(formatInvoiceDoc);

    sendSuccess(res, "Billing fetched successfully", {
      items: formattedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }),

  getById: asyncHandler(async (req, res) => {
    const userRole = req.user?.workspaceRole || req.user?.role;
    const item = await Billing.findById(req.params.id).populate("patientId doctorId appointmentId");
    if (!item) {
      throw new ApiError(404, "Invoice not found");
    }

    if (userRole === "patient") {
      const patientDoc = await getAuthenticatedPatientDoc(req);
      const itemPatientId = String(item.patientId?._id || item.patientId || "");
      if (!patientDoc || String(patientDoc._id) !== itemPatientId) {
        throw new ApiError(403, "Access denied.");
      }
    }

    sendSuccess(res, "Invoice fetched successfully", formatInvoiceDoc(item));
  }),

  create: asyncHandler(async (req, res) => {
    const { patientId, appointmentId, doctorId, totalAmount, amountPaid, paymentStatus } = req.body;
    await validateInvoiceData(patientId, appointmentId, doctorId);

    const total = Number(totalAmount || req.body.amount || 0);
    const paid = Number(amountPaid || (paymentStatus === "Paid" ? total : 0));
    const due = Math.max(0, total - paid);

    const invoiceData = {
      ...req.body,
      amountPaid: paid,
      amountDue: due,
    };

    const item = await Billing.create(invoiceData);
    const populated = await Billing.findById(item._id).populate("patientId doctorId appointmentId");
    sendSuccess(res, "Invoice created successfully", formatInvoiceDoc(populated), 201);
  }),

  update: asyncHandler(async (req, res) => {
    const existing = await Billing.findById(req.params.id);
    if (!existing) {
      throw new ApiError(404, "Invoice not found");
    }

    const patientId = req.body.patientId || existing.patientId;
    const appointmentId = req.body.appointmentId || existing.appointmentId;
    const doctorId = req.body.doctorId || existing.doctorId;

    await validateInvoiceData(patientId, appointmentId, doctorId);

    const total = Number(req.body.totalAmount || existing.totalAmount || 0);
    const paid = Number(req.body.amountPaid !== undefined ? req.body.amountPaid : (req.body.paymentStatus === "Paid" ? total : existing.amountPaid || 0));
    const due = Math.max(0, total - paid);

    const updateData = {
      ...req.body,
      amountPaid: paid,
      amountDue: due,
    };

    const item = await Billing.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("patientId doctorId appointmentId");

    sendSuccess(res, "Invoice updated successfully", formatInvoiceDoc(item));
  }),

  processPayment: asyncHandler(async (req, res) => {
    const userRole = req.user?.workspaceRole || req.user?.role;
    const existing = await Billing.findById(req.params.id).populate("patientId doctorId appointmentId");

    if (!existing) {
      throw new ApiError(404, "Invoice not found");
    }

    if (userRole === "patient") {
      const patientDoc = await getAuthenticatedPatientDoc(req);
      const invoicePatientId = String(existing.patientId?._id || existing.patientId || "");
      if (!patientDoc || String(patientDoc._id) !== invoicePatientId) {
        throw new ApiError(403, "Access denied. You can only pay your own invoices.");
      }
    }

    const total = Number(existing.totalAmount || 0);
    const paid = Number(existing.amountPaid !== undefined ? existing.amountPaid : (existing.paymentStatus === "Paid" ? total : 0));
    const due = Math.max(0, total - paid);

    if (due <= 0 || existing.paymentStatus === "Paid") {
      throw new ApiError(400, "This time slot or invoice is already fully paid.");
    }

    const { paymentMethod = "Card" } = req.body;
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const transactionId = `TXN-${dateStr}-${randomNum}`;

    existing.amountPaid = total;
    existing.amountDue = 0;
    existing.paymentStatus = "Paid";
    existing.paymentDate = new Date();
    existing.paymentMethod = paymentMethod;
    existing.transactionId = transactionId;

    await existing.save();

    const updated = await Billing.findById(existing._id).populate("patientId doctorId appointmentId");
    sendSuccess(res, "Payment processed successfully", formatInvoiceDoc(updated));
  }),
};

