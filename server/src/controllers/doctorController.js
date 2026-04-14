import Doctor from "../models/Doctor.js";
import createCrudController from "./crudFactory.js";

export default createCrudController(Doctor, "Doctors", "departmentId");

