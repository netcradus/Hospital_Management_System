import Appointment from "../models/Appointment.js";
import createCrudController from "./crudFactory.js";

export default createCrudController(Appointment, "Appointments", "patientId doctorId");

