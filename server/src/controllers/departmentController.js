import Department from "../models/Department.js";
import createCrudController from "./crudFactory.js";

export default createCrudController(Department, "Departments", "headDoctor");

