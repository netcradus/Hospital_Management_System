import Billing from "../models/Billing.js";
import createCrudController from "./crudFactory.js";

export default createCrudController(Billing, "Billing", "patientId doctorId appointmentId");

