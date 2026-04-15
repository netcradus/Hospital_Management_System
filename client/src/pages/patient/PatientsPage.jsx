import CrudManagerPage from "../../components/common/CrudManagerPage";
import { useLanguage } from "../../context/LanguageContext";
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
  const { t } = useLanguage();
  const { items, isLoading, isSubmitting, createItem, updateItem, deleteItem } = useCrudResource(patientService, t("resource.patient"));

  return (
    <CrudManagerPage
      title={t("patients.title")}
      subtitle={t("patients.subtitle")}
      description={t("patients.description")}
      resourceLabel={t("resource.patient")}
      items={items}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      onCreate={createItem}
      onUpdate={updateItem}
      onDelete={deleteItem}
      defaultValues={defaultValues}
      fields={[
        { name: "firstName", label: t("patients.firstName"), rules: { required: t("patients.firstNameRequired") } },
        { name: "lastName", label: t("patients.lastName"), rules: { required: t("patients.lastNameRequired") } },
        { name: "email", label: t("patients.email"), type: "email" },
        { name: "phone", label: t("patients.phone") },
        { name: "gender", label: t("patients.gender"), type: "select", options: [{ value: "Male", label: t("option.male") }, { value: "Female", label: t("option.female") }, { value: "Other", label: t("option.other") }] },
        { name: "bloodType", label: t("patients.bloodType") },
        { name: "city", label: t("patients.city") },
        { name: "status", label: t("patients.status"), type: "select", options: [{ value: "Active", label: t("option.active") }, { value: "Inactive", label: t("option.inactive") }] },
      ]}
      columns={[
        { key: "firstName", label: t("patients.firstName") },
        { key: "lastName", label: t("patients.lastName") },
        { key: "email", label: t("patients.email") },
        { key: "phone", label: t("patients.phone") },
        { key: "status", label: t("patients.status"), render: (value) => (value === "Inactive" ? t("option.inactive") : t("option.active")) },
      ]}
    />
  );
}

export default PatientsPage;
