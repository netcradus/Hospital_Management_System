import CrudManagerPage from "../../components/common/CrudManagerPage";
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
  const { items, isLoading, isSubmitting, createItem, updateItem, deleteItem } = useCrudResource(departmentService, "Department");

  return (
    <CrudManagerPage
      title="Departments"
      subtitle="Create, edit, view, and remove hospital departments using live backend data."
      description="Real-time department records from MongoDB."
      resourceLabel="Department"
      items={items}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      onCreate={createItem}
      onUpdate={updateItem}
      onDelete={deleteItem}
      defaultValues={defaultValues}
      fields={[
        { name: "name", label: "Department name", rules: { required: "Department name is required" } },
        { name: "description", label: "Description", type: "textarea" },
        { name: "phone", label: "Phone" },
        { name: "email", label: "Email", type: "email" },
      ]}
      columns={[
        { key: "name", label: "Department" },
        { key: "description", label: "Description" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
      ]}
    />
  );
}

export default DepartmentsPage;

