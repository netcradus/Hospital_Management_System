import { useEffect, useState } from "react";
import CrudManagerPage from "../../components/common/CrudManagerPage";
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
  const { items, isLoading, isSubmitting, createItem, updateItem, deleteItem } = useCrudResource(staffService, "Staff");
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
      title="Staff management"
      subtitle="Manage staff profiles, roles, and department assignments from the backend."
      description="Live staff directory with full CRUD actions."
      resourceLabel="Staff"
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
        { name: "firstName", label: "First name", rules: { required: "First name is required" } },
        { name: "lastName", label: "Last name", rules: { required: "Last name is required" } },
        { name: "role", label: "Role", rules: { required: "Role is required" } },
        { name: "phone", label: "Phone" },
        { name: "email", label: "Email", type: "email" },
        { name: "departmentId", label: "Department", type: "select", options: departmentOptions },
        { name: "status", label: "Status", type: "select", options: [{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }] },
      ]}
      columns={[
        { key: "firstName", label: "First Name" },
        { key: "lastName", label: "Last Name" },
        { key: "role", label: "Role" },
        { key: "email", label: "Email" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}

export default StaffPage;

