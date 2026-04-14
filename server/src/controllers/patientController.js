import Patient from "../models/Patient.js";
import createCrudController from "./crudFactory.js";

export default createCrudController(Patient, "Patients");

