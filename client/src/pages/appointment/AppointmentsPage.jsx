import { useEffect, useState } from "react";
import CrudManagerPage from "../../components/common/CrudManagerPage";
import useCrudResource from "../../hooks/useCrudResource";
import { createEntityService } from "../../services/entityService";

const appointmentService = createEntityService("appointments");
const patientService = createEntityService("patients");
const doctorService = createEntityService("doctors");

const defaultValues = {
  patientId: "",
  doctorId: "",
  appointmentDate: "",
  appointmentTime: "",
  duration: 30,
  reasonForVisit: "",
  status: "Scheduled",
};

function AppointmentsPage() {
  const { items, isLoading, isSubmitting, createItem, updateItem, deleteItem } = useCrudResource(appointmentService, "Appointment");
  const [patientOptions, setPatientOptions] = useState([{ value: "", label: "Select patient" }]);
  const [doctorOptions, setDoctorOptions] = useState([{ value: "", label: "Select doctor" }]);

  useEffect(() => {
    const loadDependencies = async () => {
      const [patients, doctors] = await Promise.all([patientService.list({ limit: 100 }), doctorService.list({ limit: 100 })]);

      setPatientOptions([
        { value: "", label: "Select patient" },
        ...patients.items.map((patient) => ({ value: patient._id, label: `${patient.firstName} ${patient.lastName}` })),
      ]);
      setDoctorOptions([
        { value: "", label: "Select doctor" },
        ...doctors.items.map((doctor) => ({ value: doctor._id, label: `${doctor.firstName} ${doctor.lastName}` })),
      ]);
    };

    loadDependencies();
  }, []);

  return (
    <CrudManagerPage
      title="Appointments"
      subtitle="Book, edit, review, and cancel appointments against live patient and doctor records."
      description="Real-time appointment scheduling data."
      resourceLabel="Appointment"
      items={items}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      onCreate={createItem}
      onUpdate={updateItem}
      onDelete={deleteItem}
      defaultValues={defaultValues}
      createPayload={(values) => ({
        ...values,
        duration: Number(values.duration || 30),
      })}
      editPayload={(item) => ({
        ...item,
        patientId: item.patientId?._id || "",
        doctorId: item.doctorId?._id || "",
        appointmentDate: item.appointmentDate ? new Date(item.appointmentDate).toISOString().slice(0, 10) : "",
      })}
      fields={[
        { name: "patientId", label: "Patient", type: "select", options: patientOptions, rules: { required: "Patient is required" } },
        { name: "doctorId", label: "Doctor", type: "select", options: doctorOptions, rules: { required: "Doctor is required" } },
        { name: "appointmentDate", label: "Appointment date", type: "date", rules: { required: "Appointment date is required" } },
        { name: "appointmentTime", label: "Appointment time", type: "time", rules: { required: "Appointment time is required" } },
        { name: "duration", label: "Duration (minutes)", type: "number" },
        { name: "reasonForVisit", label: "Reason for visit", type: "textarea" },
        { name: "status", label: "Status", type: "select", options: [{ value: "Scheduled", label: "Scheduled" }, { value: "In-Progress", label: "In-Progress" }, { value: "Completed", label: "Completed" }, { value: "Cancelled", label: "Cancelled" }, { value: "Rescheduled", label: "Rescheduled" }] },
      ]}
      columns={[
        { key: "patientId", label: "Patient", render: (value) => (value ? `${value.firstName} ${value.lastName}` : "-") },
        { key: "doctorId", label: "Doctor", render: (value) => (value ? `${value.firstName} ${value.lastName}` : "-") },
        { key: "appointmentDate", label: "Date", render: (value) => (value ? new Date(value).toLocaleDateString() : "-") },
        { key: "appointmentTime", label: "Time" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}

export default AppointmentsPage;
