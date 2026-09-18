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
    {
      name: "firstName",
      label: "First Name",
      maxLength: 50,
      rules: {
        required: "First Name is required",
        maxLength: { value: 50, message: "First Name cannot exceed 50 characters" },
        validate: {
          noWhitespaceOnly: (val) => (val && val.trim().length >= 2) || "First Name must be at least 2 characters",
          onlyAlphaSpace: (val) => /^[A-Za-z\s]+$/.test(val?.trim() || "") || "First Name can only contain letters and spaces",
        },
      },
    },
    {
      name: "lastName",
      label: "Last Name",
      maxLength: 50,
      rules: {
        required: "Last Name is required",
        maxLength: { value: 50, message: "Last Name cannot exceed 50 characters" },
        validate: {
          noWhitespaceOnly: (val) => (val && val.trim().length >= 2) || "Last Name must be at least 2 characters",
          onlyAlphaSpace: (val) => /^[A-Za-z\s]+$/.test(val?.trim() || "") || "Last Name can only contain letters and spaces",
        },
      },
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      maxLength: 100,
      rules: {
        required: "Email is required",
        maxLength: { value: 100, message: "Email cannot exceed 100 characters" },
        pattern: {
          value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          message: "Please enter a valid email address",
        },
        validate: {
          notEmpty: (val) => (val && val.trim().length > 0) || "Email is required",
        },
      },
    },
    {
      name: "phone",
      label: "Phone",
      maxLength: 10,
      onInput: (e) => {
        e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
      },
      rules: {
        required: "Phone number is required",
        maxLength: { value: 10, message: "Phone number must be exactly 10 digits" },
        pattern: {
          value: /^[6-9]\d{9}$/,
          message: "Phone number must be a valid 10-digit number starting with 6, 7, 8, or 9",
        },
      },
    },
    {
      name: "specialization",
      label: "Specialization",
      maxLength: 100,
      rules: {
        required: "Specialization is required",
        maxLength: { value: 100, message: "Specialization cannot exceed 100 characters" },
        validate: {
          noWhitespaceOnly: (val) => (val && val.trim().length >= 2) || "Specialization must be at least 2 characters",
          validText: (val) => /^[A-Za-z0-9\s/,-]+$/.test(val?.trim() || "") || "Specialization contains invalid characters",
        },
      },
    },
    {
      name: "qualifications",
      label: "Qualifications (comma separated)",
      maxLength: 200,
      rules: {
        required: "Qualifications are required",
        maxLength: { value: 200, message: "Qualifications cannot exceed 200 characters" },
        validate: {
          noWhitespaceOnly: (val) => (val && val.trim().length >= 2) || "Qualifications must be at least 2 characters",
        },
      },
    },
    {
      name: "licenseNumber",
      label: "License Number",
      maxLength: 30,
      rules: {
        required: "License number is required",
        maxLength: { value: 30, message: "License number cannot exceed 30 characters" },
        validate: {
          noWhitespaceOnly: (val) => (val && val.trim().length >= 3) || "License number must be at least 3 characters",
          validFormat: (val) => /^[A-Za-z0-9-/]+$/.test(val?.trim() || "") || "License number can only contain letters, numbers, hyphens, and slashes",
        },
      },
    },
    {
      name: "yearsExperience",
      label: "Years of Experience",
      type: "number",
      min: 0,
      max: 70,
      onInput: (e) => {
        if (e.target.value !== "" && e.target.value < 0) e.target.value = 0;
        if (e.target.value > 70) e.target.value = 70;
      },
      rules: {
        required: "Years of experience is required",
        min: { value: 0, message: "Experience cannot be negative" },
        max: { value: 70, message: "Experience cannot exceed 70 years" },
      },
    },
    {
      name: "departmentId",
      label: "Department",
      type: "select",
      options: departmentOptions,
      rules: {
        required: "Please select a department",
        validate: (val) => Boolean(val && String(val).trim()) || "Please select a department",
      },
    },
    {
      name: "consultationFee",
      label: "Consultation Fee",
      type: "number",
      step: "0.01",
      min: 0,
      max: 100000,
      onInput: (e) => {
        if (e.target.value !== "" && e.target.value < 0) e.target.value = 0;
      },
      rules: {
        required: "Consultation fee is required",
        min: { value: 0, message: "Consultation fee cannot be negative" },
        max: { value: 100000, message: "Consultation fee cannot exceed 100,000" },
      },
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" },
      ],
      rules: {
        required: "Status is required",
        validate: (val) => ["Active", "Inactive"].includes(val) || "Please select a valid status",
      },
    },
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
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        specialization: values.specialization.trim(),
        licenseNumber: values.licenseNumber.trim().toUpperCase(),
        qualifications: values.qualifications ? values.qualifications.split(",").map((q) => q.trim()).filter(Boolean) : [],
        yearsExperience: Number(values.yearsExperience),
        consultationFee: Number(values.consultationFee),
        departmentId: values.departmentId || undefined,
      })}
      editPayload={(item) => ({
        ...item,
        departmentId: item.departmentId?._id || item.departmentId || "",
        qualifications: Array.isArray(item.qualifications) ? item.qualifications.join(", ") : item.qualifications || "",
        yearsExperience: item.yearsExperience ?? "",
        consultationFee: item.consultationFee ?? "",
      })}
    />
  );
}

export default DoctorsManagementPage;
