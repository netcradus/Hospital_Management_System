import CrudManagerPage from "../../components/common/CrudManagerPage";
import useCrudResource from "../../hooks/useCrudResource";
import { createEntityService } from "../../services/entityService";

const patientService = createEntityService("patients");

const defaultValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  gender: "Male",
  bloodType: "",
  city: "",
  status: "Active",
};

function PatientsPage() {
  const { items, isLoading, isSubmitting, createItem, updateItem, deleteItem } = useCrudResource(patientService, "Patient");

  return (
    <CrudManagerPage
      title="Patient records"
      subtitle="Create, update, view, and delete patient profiles from the live backend."
      description="Real-time patient data from MongoDB."
      resourceLabel="Patient"
      items={items}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      onCreate={createItem}
      onUpdate={updateItem}
      onDelete={deleteItem}
      defaultValues={defaultValues}
      fields={[
        { name: "firstName", label: "First name", rules: { required: "First name is required" } },
        { name: "lastName", label: "Last name", rules: { required: "Last name is required" } },
        { name: "email", label: "Email", type: "email" },
        { name: "phone", label: "Phone" },
        { name: "gender", label: "Gender", type: "select", options: [{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }] },
        { name: "bloodType", label: "Blood type" },
        { name: "city", label: "City" },
        { name: "status", label: "Status", type: "select", options: [{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }] },
      ]}
      columns={[
        { key: "firstName", label: "First Name" },
        { key: "lastName", label: "Last Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}

export default PatientsPage;
