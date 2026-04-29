import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Button from "./Button";
import Card from "./Card";
import ConfirmDialog from "./ConfirmDialog";
import DataTable from "./DataTable";
import InputField from "./InputField";
import PageHeader from "./PageHeader";
import SelectField from "./SelectField";
import TextAreaField from "./TextAreaField";
import { useLanguage } from "../../context/LanguageContext";

function renderField(field, register, errors) {
  const commonProps = {
    label: field.label,
    error: errors[field.name]?.message,
  };

  if (field.type === "select") {
    return (
      <SelectField
        {...commonProps}
        options={field.options || []}
        {...register(field.name, field.rules)}
      />
    );
  }

  if (field.type === "textarea") {
    return (
      <TextAreaField
        {...commonProps}
        placeholder={field.placeholder}
        {...register(field.name, field.rules)}
      />
    );
  }

  return (
    <InputField
      {...commonProps}
      type={field.type || "text"}
      placeholder={field.placeholder}
      step={field.step}
      {...register(field.name, field.rules)}
    />
  );
}

function CrudManagerPage({
  title,
  subtitle,
  description,
  resourceLabel,
  fields,
  columns,
  items,
  isLoading,
  isSubmitting,
  onCreate,
  onUpdate,
  onDelete,
  createPayload,
  editPayload,
  defaultValues,
}) {
  const { t } = useLanguage();
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues,
  });

  useEffect(() => {
    if (editingItem) {
      reset(editPayload ? editPayload(editingItem) : editingItem);
      return;
    }

    reset(defaultValues);
  }, [editingItem, reset, defaultValues, editPayload]);

  const handleSave = async (values) => {
    const payload = createPayload ? createPayload(values) : values;

    if (editingItem) {
      await onUpdate(editingItem._id, payload);
    } else {
      await onCreate(payload);
    }

    setEditingItem(null);
    reset(defaultValues);
  };

  const rows = items.map((item) => ({
    ...item,
    actions: item,
  }));

  const tableColumns = [
    ...columns,
    {
      key: "actions",
      label: t("crud.actions"),
      render: (_value, row) => (
        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="px-3 py-2" onClick={() => setEditingItem(row)}>
            {t("crud.edit")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="px-3 py-2 text-red-600"
            onClick={() => setDeletingItem(row)}
          >
            {t("crud.delete")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader title={title} description={subtitle} eyebrow={t("crud.management", { resource: resourceLabel })} />

      <section className="grid gap-6 2xl:grid-cols-[1.25fr_0.75fr]">
        <Card
          title={editingItem ? t("crud.editTitle", { resource: resourceLabel }) : t("crud.addTitle", { resource: resourceLabel })}
          subtitle={editingItem ? t("crud.editSubtitle") : t("crud.addSubtitle")}
        >
          <form className="space-y-4" onSubmit={handleSubmit(handleSave)}>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                  {renderField(field, register, errors)}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? t("crud.saving") : editingItem ? t("crud.updateRecord") : t("crud.createRecord")}
              </Button>
              {editingItem && (
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setEditingItem(null);
                    reset(defaultValues);
                  }}
                >
                  {t("crud.cancel")}
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card
          title={t("crud.directory", { resource: resourceLabel })}
          subtitle={description}
          action={<span className="text-xs text-[var(--text-muted)] sm:text-sm">{isLoading ? t("common.loading") : t("crud.recordsCount", { count: items.length })}</span>}
        >
          <DataTable
            columns={tableColumns}
            rows={rows}
            isLoading={isLoading}
            title={`${resourceLabel} directory`}
            emptyTitle={`No ${resourceLabel.toLowerCase()} records yet`}
            emptyDescription={description}
          />
        </Card>
      </section>

      <ConfirmDialog
        open={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={async () => {
          if (!deletingItem) {
            return;
          }

          await onDelete(deletingItem._id);
          setDeletingItem(null);
        }}
        title={`Delete ${resourceLabel}`}
        description={t("crud.confirmDelete", { resource: resourceLabel.toLowerCase() })}
        confirmLabel={t("crud.delete")}
      />
    </div>
  );
}

export default CrudManagerPage;
