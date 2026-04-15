import { useEffect, useState } from "react";
import CrudManagerPage from "../../components/common/CrudManagerPage";
import { useLanguage } from "../../context/LanguageContext";
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
  const { t, formatDate } = useLanguage();
  const { items, isLoading, isSubmitting, createItem, updateItem, deleteItem } = useCrudResource(appointmentService, t("resource.appointment"));
  const [patientOptions, setPatientOptions] = useState([{ value: "", label: t("appointments.selectPatient") }]);
  const [doctorOptions, setDoctorOptions] = useState([{ value: "", label: t("appointments.selectDoctor") }]);

  useEffect(() => {
    const loadDependencies = async () => {
      const [patients, doctors] = await Promise.all([patientService.list({ limit: 100 }), doctorService.list({ limit: 100 })]);

      setPatientOptions([
        { value: "", label: t("appointments.selectPatient") },
        ...patients.items.map((patient) => ({ value: patient._id, label: `${patient.firstName} ${patient.lastName}` })),
      ]);
      setDoctorOptions([
        { value: "", label: t("appointments.selectDoctor") },
        ...doctors.items.map((doctor) => ({ value: doctor._id, label: `${doctor.firstName} ${doctor.lastName}` })),
      ]);
    };

    loadDependencies();
  }, [t]);

  return (
    <CrudManagerPage
      title={t("appointments.title")}
      subtitle={t("appointments.subtitle")}
      description={t("appointments.description")}
      resourceLabel={t("resource.appointment")}
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
        { name: "patientId", label: t("resource.patient"), type: "select", options: patientOptions, rules: { required: t("appointments.patientRequired") } },
        { name: "doctorId", label: t("resource.doctor"), type: "select", options: doctorOptions, rules: { required: t("appointments.doctorRequired") } },
        { name: "appointmentDate", label: t("appointments.date"), type: "date", rules: { required: t("appointments.dateRequired") } },
        { name: "appointmentTime", label: t("appointments.time"), type: "time", rules: { required: t("appointments.timeRequired") } },
        { name: "duration", label: t("appointments.duration"), type: "number" },
        { name: "reasonForVisit", label: t("appointments.reason"), type: "textarea" },
        {
          name: "status",
          label: t("patients.status"),
          type: "select",
          options: [
            { value: "Scheduled", label: t("option.scheduled") },
            { value: "In-Progress", label: t("option.inProgress") },
            { value: "Completed", label: t("option.completed") },
            { value: "Cancelled", label: t("option.cancelled") },
            { value: "Rescheduled", label: t("option.rescheduled") },
          ],
        },
      ]}
      columns={[
        { key: "patientId", label: t("resource.patient"), render: (value) => (value ? `${value.firstName} ${value.lastName}` : "-") },
        { key: "doctorId", label: t("resource.doctor"), render: (value) => (value ? `${value.firstName} ${value.lastName}` : "-") },
        { key: "appointmentDate", label: t("field.date"), render: (value) => (value ? formatDate(value) : "-") },
        { key: "appointmentTime", label: t("field.time") },
        {
          key: "status",
          label: t("patients.status"),
          render: (value) =>
            ({
              Scheduled: t("option.scheduled"),
              "In-Progress": t("option.inProgress"),
              Completed: t("option.completed"),
              Cancelled: t("option.cancelled"),
              Rescheduled: t("option.rescheduled"),
            }[value] || value),
        },
      ]}
    />
  );
}

export default AppointmentsPage;
