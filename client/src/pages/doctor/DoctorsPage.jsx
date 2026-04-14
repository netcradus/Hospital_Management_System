import { useEffect, useState } from "react";
import CrudManagerPage from "../../components/common/CrudManagerPage";
import useCrudResource from "../../hooks/useCrudResource";
import { createEntityService } from "../../services/entityService";

const doctorService = createEntityService("doctors");
const departmentService = createEntityService("departments");

const defaultValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  specialization: "",
  licenseNumber: "",
  yearsExperience: 0,
  consultationFee: 0,
  departmentId: "",
  status: "Active",
};

function DoctorsPage() {
  const { items, isLoading, isSubmitting, createItem, updateItem, deleteItem } = useCrudResource(doctorService, "Doctor");
  const [departmentOptions, setDepartmentOptions] = useState([{ value: "", label: "Select department" }]);

  useEffect(() => {
    const loadDepartments = async () => {
      const data = await departmentService.list({ limit: 100 });
      setDepartmentOptions([
        { value: "", label: "Select department" },
        ...data.items.map((department) => ({ value: department._id, label: department.name })),
      ]);
    };

    loadDepartments();
  }, []);

  return (
    <CrudManagerPage
      title="Doctor profiles"
      subtitle="Manage doctors, specialties, department assignments, and consultation fees."
      description="Live doctor data with create, update, and delete actions."
      resourceLabel="Doctor"
      items={items}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      onCreate={createItem}
      onUpdate={updateItem}
      onDelete={deleteItem}
      defaultValues={defaultValues}
      createPayload={(values) => ({
        ...values,
        yearsExperience: Number(values.yearsExperience || 0),
        consultationFee: Number(values.consultationFee || 0),
        departmentId: values.departmentId || undefined,
      })}
      editPayload={(item) => ({
        ...item,
        departmentId: item.departmentId?._id || "",
      })}
      fields={[
        { name: "firstName", label: "First name", rules: { required: "First name is required" } },
        { name: "lastName", label: "Last name", rules: { required: "Last name is required" } },
        { name: "email", label: "Email", type: "email" },
        { name: "phone", label: "Phone" },
        { name: "specialization", label: "Specialization", rules: { required: "Specialization is required" } },
        { name: "licenseNumber", label: "License number", rules: { required: "License number is required" } },
        { name: "yearsExperience", label: "Years of experience", type: "number" },
        { name: "consultationFee", label: "Consultation fee", type: "number", step: "0.01" },
        { name: "departmentId", label: "Department", type: "select", options: departmentOptions },
        { name: "status", label: "Status", type: "select", options: [{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }] },
      ]}
      columns={[
        { key: "firstName", label: "First Name" },
        { key: "lastName", label: "Last Name" },
        { key: "specialization", label: "Specialty" },
        { key: "email", label: "Email" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}

export default DoctorsPage;
