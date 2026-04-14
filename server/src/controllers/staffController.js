import Staff from "../models/Staff.js";
import createCrudController from "./crudFactory.js";

export default createCrudController(Staff, "Staff", "departmentId");

