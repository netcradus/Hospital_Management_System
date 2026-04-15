import CrudManagerPage from "../../components/common/CrudManagerPage";
import { useLanguage } from "../../context/LanguageContext";
import useCrudResource from "../../hooks/useCrudResource";
import { createEntityService } from "../../services/entityService";

const departmentService = createEntityService("departments");

const defaultValues = {
  name: "",
  description: "",
  phone: "",
  email: "",
};

function DepartmentsPage() {
  const { t } = useLanguage();
  const { items, isLoading, isSubmitting, createItem, updateItem, deleteItem } = useCrudResource(departmentService, t("resource.department"));

  return (
    <CrudManagerPage
      title={t("departments.title")}
      subtitle={t("departments.subtitle")}
      description={t("departments.description")}
      resourceLabel={t("resource.department")}
      items={items}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      onCreate={createItem}
      onUpdate={updateItem}
      onDelete={deleteItem}
      defaultValues={defaultValues}
      fields={[
        { name: "name", label: t("departments.name"), rules: { required: t("departments.nameRequired") } },
        { name: "description", label: t("departments.descriptionField"), type: "textarea" },
        { name: "phone", label: t("patients.phone") },
        { name: "email", label: t("patients.email"), type: "email" },
      ]}
      columns={[
        { key: "name", label: t("resource.department") },
        { key: "description", label: t("field.description") },
        { key: "phone", label: t("patients.phone") },
        { key: "email", label: t("patients.email") },
      ]}
    />
  );
}

export default DepartmentsPage;
