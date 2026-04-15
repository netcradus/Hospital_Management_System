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
      createPayload={(values) => ({
        ...values,
        departmentId: values.departmentId || undefined,
      })}
      editPayload={(item) => ({
        ...item,
        departmentId: item.departmentId?._id || "",
      })}
      fields={[
        { name: "firstName", label: t("patients.firstName"), rules: { required: t("patients.firstNameRequired") } },
        { name: "lastName", label: t("patients.lastName"), rules: { required: t("patients.lastNameRequired") } },
        { name: "role", label: t("staff.role"), rules: { required: t("staff.roleRequired") } },
        { name: "phone", label: t("patients.phone") },
        { name: "email", label: t("patients.email"), type: "email" },
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
