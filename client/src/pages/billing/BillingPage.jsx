import { useEffect, useState } from "react";
import CrudManagerPage from "../../components/common/CrudManagerPage";
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
  const { items, isLoading, isSubmitting, createItem, updateItem, deleteItem } = useCrudResource(billingService, "Billing");
  const [patientOptions, setPatientOptions] = useState([{ value: "", label: "Select patient" }]);
  const [doctorOptions, setDoctorOptions] = useState([{ value: "", label: "Select doctor" }]);
  const [appointmentOptions, setAppointmentOptions] = useState([{ value: "", label: "Select appointment" }]);

  useEffect(() => {
    const loadDependencies = async () => {
      const [patients, doctors, appointments] = await Promise.all([
        patientService.list({ limit: 100 }),
        doctorService.list({ limit: 100 }),
        appointmentService.list({ limit: 100 }),
      ]);

      setPatientOptions([
        { value: "", label: "Select patient" },
        ...patients.items.map((patient) => ({ value: patient._id, label: `${patient.firstName} ${patient.lastName}` })),
      ]);
      setDoctorOptions([
        { value: "", label: "Select doctor" },
        ...doctors.items.map((doctor) => ({ value: doctor._id, label: `${doctor.firstName} ${doctor.lastName}` })),
      ]);
      setAppointmentOptions([
        { value: "", label: "Select appointment" },
        ...appointments.items.map((appointment) => ({
          value: appointment._id,
          label: `${appointment.patientId?.firstName || "Patient"} - ${appointment.appointmentTime || "Time"}`,
        })),
      ]);
    };

    loadDependencies();
  }, []);

  return (
    <CrudManagerPage
      title="Billing and invoices"
      subtitle="Track live billing records, payments, and invoice totals from the backend."
      description="Real-time financial records for appointments and services."
      resourceLabel="Billing"
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
        { name: "patientId", label: "Patient", type: "select", options: patientOptions, rules: { required: "Patient is required" } },
        { name: "doctorId", label: "Doctor", type: "select", options: doctorOptions },
        { name: "appointmentId", label: "Appointment", type: "select", options: appointmentOptions },
        { name: "serviceDescription", label: "Service description", type: "textarea", rules: { required: "Service description is required" } },
        { name: "amount", label: "Amount", type: "number", step: "0.01", rules: { required: "Amount is required" } },
        { name: "tax", label: "Tax", type: "number", step: "0.01" },
        { name: "discount", label: "Discount", type: "number", step: "0.01" },
        { name: "totalAmount", label: "Total amount", type: "number", step: "0.01", rules: { required: "Total amount is required" } },
        { name: "paymentStatus", label: "Payment status", type: "select", options: [{ value: "Pending", label: "Pending" }, { value: "Paid", label: "Paid" }, { value: "Partially Paid", label: "Partially Paid" }] },
        { name: "paymentMethod", label: "Payment method" },
        { name: "invoiceNumber", label: "Invoice number" },
      ]}
      columns={[
        { key: "invoiceNumber", label: "Invoice" },
        { key: "patientId", label: "Patient", render: (value) => (value ? `${value.firstName} ${value.lastName}` : "-") },
        { key: "serviceDescription", label: "Service" },
        { key: "totalAmount", label: "Total", render: (value) => `₹${Number(value || 0).toFixed(2)}` },
        { key: "paymentStatus", label: "Status" },
      ]}
    />
  );
}

export default BillingPage;
