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
  licenseNumber: "",
  yearsExperience: 0,
  consultationFee: 0,
  departmentId: "",
  status: "Active",
};

function DoctorsPage() {
  const { t } = useLanguage();
  const { items, isLoading, isSubmitting, createItem, updateItem, deleteItem } = useCrudResource(doctorService, t("resource.doctor"));
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
      title={t("doctors.title")}
      subtitle={t("doctors.subtitle")}
      description={t("doctors.description")}
      resourceLabel={t("resource.doctor")}
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
        { name: "firstName", label: t("patients.firstName"), rules: { required: t("patients.firstNameRequired") } },
        { name: "lastName", label: t("patients.lastName"), rules: { required: t("patients.lastNameRequired") } },
        { name: "email", label: t("patients.email"), type: "email" },
        { name: "phone", label: t("patients.phone") },
        { name: "specialization", label: t("doctors.specialization"), rules: { required: t("doctors.specializationRequired") } },
        { name: "licenseNumber", label: t("doctors.licenseNumber"), rules: { required: t("doctors.licenseNumberRequired") } },
        { name: "yearsExperience", label: t("doctors.yearsExperience"), type: "number" },
        { name: "consultationFee", label: t("doctors.consultationFee"), type: "number", step: "0.01" },
        { name: "departmentId", label: t("field.department"), type: "select", options: departmentOptions },
        { name: "status", label: t("patients.status"), type: "select", options: [{ value: "Active", label: t("option.active") }, { value: "Inactive", label: t("option.inactive") }] },
      ]}
      columns={[
        { key: "firstName", label: t("patients.firstName") },
        { key: "lastName", label: t("patients.lastName") },
        { key: "specialization", label: t("field.specialty") },
        { key: "email", label: t("patients.email") },
        { key: "status", label: t("patients.status"), render: (value) => (value === "Inactive" ? t("option.inactive") : t("option.active")) },
      ]}
    />
  );
}

export default DoctorsPage;
