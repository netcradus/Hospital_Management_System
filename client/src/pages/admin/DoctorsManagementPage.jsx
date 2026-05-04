import { useEffect, useState } from "react";
import CrudManagerPage from "../../components/common/CrudManagerPage";
import { useLanguage } from "../../context/LanguageContext";
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
  qualifications: "",
  licenseNumber: "",
  yearsExperience: "",
  departmentId: "",
  consultationFee: "",
  status: "Active",
};

function DoctorsManagementPage() {
  const { t } = useLanguage();
  const { items, isLoading, isSubmitting, createItem, updateItem, deleteItem } = useCrudResource(doctorService, t("resource.doctors"));
  const [departmentOptions, setDepartmentOptions] = useState([{ value: "", label: "Select Department" }]);

  useEffect(() => {
    const loadDepartments = async () => {
      const data = await departmentService.list({ limit: 100 });
      setDepartmentOptions([
        { value: "", label: "Select Department" },
        ...data.items.map((department) => ({ value: department._id, label: department.name })),
      ]);
    };

    loadDepartments();
  }, []);

  const fields = [
    { name: "firstName", label: "First Name", rules: { required: "First name is required" } },
    { name: "lastName", label: "Last Name", rules: { required: "Last name is required" } },
    { name: "email", label: "Email" },
    { name: "phone", label: "Phone" },
    { name: "specialization", label: "Specialization", rules: { required: "Specialization is required" } },
    { name: "qualifications", label: "Qualifications (comma separated)" },
    { name: "licenseNumber", label: "License Number", rules: { required: "License number is required" } },
    { name: "yearsExperience", label: "Years of Experience", type: "number" },
    { name: "departmentId", label: "Department", type: "select", options: departmentOptions },
    { name: "consultationFee", label: "Consultation Fee", type: "number", step: "0.01" },
    { name: "status", label: "Status", type: "select", options: [
      { value: "Active", label: "Active" },
      { value: "Inactive", label: "Inactive" },
    ] },
  ];

  return (
    <CrudManagerPage
      title="Doctors Management"
      subtitle="Manage hospital doctors"
      description="Add, edit, and remove doctors from the system."
      resourceLabel="Doctor"
      fields={fields}
      columns={[
        { key: "firstName", label: "First Name" },
        { key: "lastName", label: "Last Name" },
        { key: "specialization", label: "Specialization" },
        {
          key: "departmentId",
          label: "Department",
          render: (value) => value?.name || "-",
          searchValue: (row) => row.departmentId?.name || "",
          exportValue: (row) => row.departmentId?.name || "",
        },
        { key: "email", label: "Email" },
        { key: "status", label: "Status" },
      ]}
      items={items}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      onCreate={createItem}
      onUpdate={updateItem}
      onDelete={deleteItem}
      defaultValues={defaultValues}
      layout="stacked"
      createPayload={(values) => ({
        ...values,
        qualifications: values.qualifications ? values.qualifications.split(",").map(q => q.trim()) : [],
      })}
      editPayload={(item) => ({
        ...item,
        departmentId: item.departmentId?._id || "",
        qualifications: item.qualifications ? item.qualifications.join(", ") : "",
      })}
    />
  );
}

export default DoctorsManagementPage;
