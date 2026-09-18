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
    {
      name: "name",
      label: "Department Name",
      maxLength: 100,
      rules: {
        required: "Department Name is required",
        maxLength: { value: 100, message: "Department Name cannot exceed 100 characters" },
        validate: {
          noWhitespaceOnly: (val) => Boolean(val && val.trim().length > 0) || "Department Name is required",
          minLength: (val) => !val || val.trim().length >= 2 || "Department Name must be at least 2 characters",
          onlyAlphaSpace: (val) => !val || /^[A-Za-z\s]+$/.test(val.trim()) || "Department Name must contain only letters and spaces",
        },
      },
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      maxLength: 500,
      rules: {
        maxLength: { value: 500, message: "Description cannot exceed 500 characters" },
        validate: {
          notWhitespaceOnly: (val) => {
            if (!val || val.length === 0) return true;
            return val.trim().length > 0 || "Description cannot contain only whitespace";
          },
        },
      },
    },
    {
      name: "headDoctor",
      label: "Head Doctor",
      type: "select",
      options: doctorOptions,
      rules: {},
    },
    {
      name: "phone",
      label: "Phone Number",
      maxLength: 10,
      onInput: (e) => {
        e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
      },
      rules: {
        validate: {
          tenDigitsIfProvided: (val) => {
            if (!val || val.trim() === "") return true;
            return /^[6-9]\d{9}$/.test(val.trim()) || "Please enter a valid 10-digit phone number";
          },
        },
      },
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      maxLength: 100,
      rules: {
        maxLength: { value: 100, message: "Email cannot exceed 100 characters" },
        validate: {
          validEmailIfProvided: (val) => {
            if (!val || val.trim() === "") return true;
            if (val.includes("..")) return "Please enter a valid email address";
            return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val.trim()) || "Please enter a valid email address";
          },
        },
      },
    },
  ];

  return (
    <CrudManagerPage
      title="Departments Management"
      subtitle="Manage hospital departments"
      description="Add, edit, and remove departments from the system."
      resourceLabel="Department"
      fields={fields}
      columns={[
        { key: "name", label: "Department Name" },
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
        { key: "phone", label: "Phone Number" },
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
        name: values.name ? values.name.trim() : "",
        description: values.description ? values.description.trim() : "",
        headDoctor: values.headDoctor && values.headDoctor.trim() ? values.headDoctor.trim() : undefined,
        phone: values.phone ? values.phone.trim() : "",
        email: values.email ? values.email.trim() : "",
      })}
      editPayload={(item) => ({
        ...item,
        name: item.name || "",
        description: item.description || "",
        headDoctor: item.headDoctor?._id || item.headDoctor || "",
        phone: item.phone || "",
        email: item.email || "",
      })}
    />
  );
}

export default DepartmentsManagementPage;
