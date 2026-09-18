import Patient from "../models/Patient.js";
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

    return baseCrud.getById(req, res);
  }),
};

