import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Button from "./Button";
import Card from "./Card";
import DataTable from "./DataTable";
import InputField from "./InputField";
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
            className="px-3 py-2 text-red-600 hover:bg-red-50"
            onClick={() => {
              if (window.confirm(t("crud.confirmDelete", { resource: resourceLabel.toLowerCase() }))) {
                onDelete(row._id);
              }
            }}
          >
            {t("crud.delete")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-brand-600 sm:text-sm sm:tracking-[0.25em]">{t("crud.management", { resource: resourceLabel })}</p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">{subtitle}</p>
      </div>

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
          action={<span className="text-xs text-slate-500 sm:text-sm">{isLoading ? t("common.loading") : t("crud.recordsCount", { count: items.length })}</span>}
        >
          <DataTable columns={tableColumns} rows={rows} />
        </Card>
      </section>
    </div>
  );
}

export default CrudManagerPage;
