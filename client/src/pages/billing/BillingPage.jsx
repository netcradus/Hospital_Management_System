import { useEffect, useState } from "react";
import CrudManagerPage from "../../components/common/CrudManagerPage";
import { useLanguage } from "../../context/LanguageContext";
import useCrudResource from "../../hooks/useCrudResource";
import { createEntityService } from "../../services/entityService";

const billingService = createEntityService("billing");
const patientService = createEntityService("patients");
const doctorService = createEntityService("doctors");
const appointmentService = createEntityService("appointments");

const defaultValues = {
  patientId: "",
  doctorId: "",
  appointmentId: "",
  serviceDescription: "",
  amount: 0,
  tax: 0,
  discount: 0,
  totalAmount: 0,
  paymentStatus: "Pending",
  paymentMethod: "",
  invoiceNumber: "",
};

function BillingPage() {
  const { t, formatCurrency } = useLanguage();
  const { items, isLoading, isSubmitting, createItem, updateItem, deleteItem } = useCrudResource(billingService, t("resource.billing"));
  const [patientOptions, setPatientOptions] = useState([{ value: "", label: t("billing.selectPatient") }]);
  const [doctorOptions, setDoctorOptions] = useState([{ value: "", label: t("billing.selectDoctor") }]);
  const [appointmentOptions, setAppointmentOptions] = useState([{ value: "", label: t("billing.selectAppointment") }]);

  useEffect(() => {
    const loadDependencies = async () => {
      const [patients, doctors, appointments] = await Promise.all([
        patientService.list({ limit: 100 }),
        doctorService.list({ limit: 100 }),
        appointmentService.list({ limit: 100 }),
      ]);

      setPatientOptions([
        { value: "", label: t("billing.selectPatient") },
        ...patients.items.map((patient) => ({ value: patient._id, label: `${patient.firstName} ${patient.lastName}` })),
      ]);
      setDoctorOptions([
        { value: "", label: t("billing.selectDoctor") },
        ...doctors.items.map((doctor) => ({ value: doctor._id, label: `${doctor.firstName} ${doctor.lastName}` })),
      ]);
      setAppointmentOptions([
        { value: "", label: t("billing.selectAppointment") },
        ...appointments.items.map((appointment) => ({
          value: appointment._id,
          label: `${appointment.patientId?.firstName || t("resource.patient")} - ${appointment.appointmentTime || t("field.time")}`,
        })),
      ]);
    };

    loadDependencies();
  }, [t]);

  return (
    <CrudManagerPage
      title={t("billing.title")}
      subtitle={t("billing.subtitle")}
      description={t("billing.description")}
      resourceLabel={t("resource.billing")}
      items={items}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      onCreate={createItem}
      onUpdate={updateItem}
      onDelete={deleteItem}
      defaultValues={defaultValues}
      createPayload={(values) => {
        const amount = Number(values.amount || 0);
        const tax = Number(values.tax || 0);
        const discount = Number(values.discount || 0);
        const totalAmount = values.totalAmount !== "" ? Number(values.totalAmount) : amount + tax - discount;

        return {
          ...values,
          amount,
          tax,
          discount,
          totalAmount,
          doctorId: values.doctorId || undefined,
          appointmentId: values.appointmentId || undefined,
          invoiceNumber: values.invoiceNumber || undefined,
        };
      }}
      editPayload={(item) => ({
        ...item,
        patientId: item.patientId?._id || "",
        doctorId: item.doctorId?._id || "",
        appointmentId: item.appointmentId?._id || "",
      })}
      fields={[
        { name: "patientId", label: t("resource.patient"), type: "select", options: patientOptions, rules: { required: t("appointments.patientRequired") } },
        { name: "doctorId", label: t("resource.doctor"), type: "select", options: doctorOptions },
        { name: "appointmentId", label: t("resource.appointment"), type: "select", options: appointmentOptions },
        { name: "serviceDescription", label: t("billing.serviceDescription"), type: "textarea", rules: { required: t("billing.serviceDescriptionRequired") } },
        { name: "amount", label: t("billing.amount"), type: "number", step: "0.01", rules: { required: t("billing.amountRequired") } },
        { name: "tax", label: t("billing.tax"), type: "number", step: "0.01" },
        { name: "discount", label: t("billing.discount"), type: "number", step: "0.01" },
        { name: "totalAmount", label: t("billing.totalAmount"), type: "number", step: "0.01", rules: { required: t("billing.totalAmountRequired") } },
        {
          name: "paymentStatus",
          label: t("billing.paymentStatus"),
          type: "select",
          options: [
            { value: "Pending", label: t("option.pending") },
            { value: "Paid", label: t("option.paid") },
            { value: "Partially Paid", label: t("option.partiallyPaid") },
          ],
        },
        { name: "paymentMethod", label: t("billing.paymentMethod") },
        { name: "invoiceNumber", label: t("billing.invoiceNumber") },
      ]}
      columns={[
        { key: "invoiceNumber", label: t("field.invoice") },
        { key: "patientId", label: t("resource.patient"), render: (value) => (value ? `${value.firstName} ${value.lastName}` : "-") },
        { key: "serviceDescription", label: t("field.service") },
        { key: "totalAmount", label: t("field.total"), render: (value) => formatCurrency(value || 0) },
        {
          key: "paymentStatus",
          label: t("patients.status"),
          render: (value) =>
            ({
              Pending: t("option.pending"),
              Paid: t("option.paid"),
              "Partially Paid": t("option.partiallyPaid"),
            }[value] || value),
        },
      ]}
    />
  );
}

export default BillingPage;
