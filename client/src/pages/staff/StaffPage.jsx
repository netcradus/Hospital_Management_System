import { useEffect, useState } from "react";
import CrudManagerPage from "../../components/common/CrudManagerPage";
import { useLanguage } from "../../context/LanguageContext";
import useCrudResource from "../../hooks/useCrudResource";
import { createEntityService } from "../../services/entityService";

const staffService = createEntityService("staff");
const departmentService = createEntityService("departments");

const defaultValues = {
  firstName: "",
  lastName: "",
  role: "",
  phone: "",
  email: "",
  departmentId: "",
  status: "Active",
};

function StaffPage() {
  const { t } = useLanguage();
  const { items, isLoading, isSubmitting, createItem, updateItem, deleteItem } = useCrudResource(staffService, t("resource.staff"));
  const [departmentOptions, setDepartmentOptions] = useState([{ value: "", label: t("doctors.selectDepartment") }]);

  useEffect(() => {
    const loadDepartments = async () => {
      const data = await departmentService.list({ limit: 100 });
      setDepartmentOptions([
        { value: "", label: t("doctors.selectDepartment") },
        ...data.items.map((department) => ({ value: department._id, label: department.name })),
      ]);
    };

    loadDepartments();
  }, [t]);

  return (
    <CrudManagerPage
      title={t("staff.title")}
      subtitle={t("staff.subtitle")}
      description={t("staff.description")}
      resourceLabel={t("resource.staff")}
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
        firstName: values.firstName ? values.firstName.trim() : "",
        lastName: values.lastName ? values.lastName.trim() : "",
        role: values.role ? values.role.trim() : "",
        phone: values.phone ? values.phone.trim() : "",
        email: values.email ? values.email.trim() : "",
        departmentId: values.departmentId || undefined,
      })}
      editPayload={(item) => ({
        ...item,
        firstName: item.firstName || "",
        lastName: item.lastName || "",
        role: item.role || "",
        phone: item.phone || "",
        email: item.email || "",
        departmentId: item.departmentId?._id || item.departmentId || "",
      })}
      fields={[
        {
          name: "firstName",
          label: t("patients.firstName"),
          maxLength: 50,
          rules: {
            required: "First Name is required",
            maxLength: { value: 50, message: "First Name cannot exceed 50 characters" },
            validate: {
              notEmpty: (val) => (val && val.trim().length >= 2) || "First Name must be at least 2 characters",
              onlyAlphaSpace: (val) => /^[A-Za-z\s]+$/.test(val?.trim() || "") || "First Name can only contain letters and spaces",
            },
          },
        },
        {
          name: "lastName",
          label: t("patients.lastName"),
          maxLength: 50,
          rules: {
            maxLength: { value: 50, message: "Last Name cannot exceed 50 characters" },
            validate: {
              minLengthIfProvided: (val) =>
                !val || !val.trim() || val.trim().length >= 2 || "Last Name must be at least 2 characters",
              onlyAlphaSpace: (val) =>
                !val || !val.trim() || /^[A-Za-z\s]+$/.test(val.trim()) || "Last Name can only contain letters and spaces",
            },
          },
        },
        {
          name: "role",
          label: t("staff.role"),
          maxLength: 50,
          rules: {
            required: "Role is required",
            validate: {
              notEmpty: (val) => (val && val.trim().length > 0) || "Role is required",
            },
          },
        },
        {
          name: "phone",
          label: t("patients.phone"),
          maxLength: 10,
          onInput: (e) => {
            e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
          },
          rules: {
            validate: {
              validPhoneIfProvided: (val) =>
                !val || !val.trim() || /^[6-9]\d{9}$/.test(val.trim()) || "Phone number must be a valid 10-digit number starting with 6, 7, 8, or 9",
            },
          },
        },
        {
          name: "email",
          label: t("patients.email"),
          type: "email",
          maxLength: 100,
          rules: {
            maxLength: { value: 100, message: "Email cannot exceed 100 characters" },
            validate: {
              validEmailIfProvided: (val) =>
                !val || !val.trim() || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val.trim()) || "Please enter a valid email address",
            },
          },
        },
        { name: "departmentId", label: t("field.department"), type: "select", options: departmentOptions },
        { name: "status", label: t("patients.status"), type: "select", options: [{ value: "Active", label: t("option.active") }, { value: "Inactive", label: t("option.inactive") }] },
      ]}
      columns={[
        { key: "firstName", label: t("patients.firstName") },
        { key: "lastName", label: t("patients.lastName") },
        { key: "role", label: t("staff.role") },
        { key: "email", label: t("patients.email") },
        { key: "status", label: t("patients.status"), render: (value) => (value === "Inactive" ? t("option.inactive") : t("option.active")) },
      ]}
    />
  );
}

export default StaffPage;
