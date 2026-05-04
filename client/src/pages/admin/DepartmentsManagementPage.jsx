import { useEffect, useState } from "react";
import CrudManagerPage from "../../components/common/CrudManagerPage";
import { useLanguage } from "../../context/LanguageContext";
import useCrudResource from "../../hooks/useCrudResource";
import { createEntityService } from "../../services/entityService";

const departmentService = createEntityService("departments");
const doctorService = createEntityService("doctors");

const defaultValues = {
  name: "",
  description: "",
  headDoctor: "",
  phone: "",
  email: "",
};

function DepartmentsManagementPage() {
  const { t } = useLanguage();
  const { items, isLoading, isSubmitting, createItem, updateItem, deleteItem } = useCrudResource(departmentService, t("resource.departments"));
  const [doctorOptions, setDoctorOptions] = useState([{ value: "", label: "Select Head Doctor" }]);

  useEffect(() => {
    const loadDoctors = async () => {
      const data = await doctorService.list({ limit: 100 });
      setDoctorOptions([
        { value: "", label: "Select Head Doctor" },
        ...data.items.map((doctor) => ({ value: doctor._id, label: `${doctor.firstName} ${doctor.lastName}` })),
      ]);
    };

    loadDoctors();
  }, []);

  const fields = [
    { name: "name", label: "Name", rules: { required: "Name is required" } },
    { name: "description", label: "Description" },
    { name: "headDoctor", label: "Head Doctor", type: "select", options: doctorOptions },
    { name: "phone", label: "Phone" },
    { name: "email", label: "Email" },
  ];

  return (
    <CrudManagerPage
      title="Departments Management"
      subtitle="Manage hospital departments"
      description="Add, edit, and remove departments from the system."
      resourceLabel="Department"
      fields={fields}
      columns={[
        { key: "name", label: "Name" },
        { key: "description", label: "Description" },
        {
          key: "headDoctor",
          label: "Head Doctor",
          render: (value) => {
            const fullName = `${value?.firstName || ""} ${value?.lastName || ""}`.trim();
            return fullName || "-";
          },
          searchValue: (row) => `${row.headDoctor?.firstName || ""} ${row.headDoctor?.lastName || ""}`.trim(),
          exportValue: (row) => `${row.headDoctor?.firstName || ""} ${row.headDoctor?.lastName || ""}`.trim(),
        },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
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
        headDoctor: values.headDoctor || undefined,
      })}
      editPayload={(item) => ({
        ...item,
        headDoctor: item.headDoctor?._id || "",
      })}
    />
  );
}

export default DepartmentsManagementPage;
