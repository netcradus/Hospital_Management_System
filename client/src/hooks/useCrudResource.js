import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";

export default function useCrudResource(service, resourceLabel) {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const data = await service.list({ limit: 100 });
      setItems(data.items ?? []);
      setPagination(data.pagination ?? null);
    } catch (error) {
      toast.error(error.response?.data?.message || t("error.failedToLoad", { resource: resourceLabel.toLowerCase() }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const createItem = async (payload) => {
    setIsSubmitting(true);
    try {
      await service.create(payload);
      toast.success(t("success.created", { resource: resourceLabel }));
      await loadItems();
    } catch (error) {
      toast.error(error.response?.data?.message || t("error.create", { resource: resourceLabel.toLowerCase() }));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateItem = async (id, payload) => {
    setIsSubmitting(true);
    try {
      await service.update(id, payload);
      toast.success(t("success.updated", { resource: resourceLabel }));
      await loadItems();
    } catch (error) {
      toast.error(error.response?.data?.message || t("error.update", { resource: resourceLabel.toLowerCase() }));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteItem = async (id) => {
    setIsSubmitting(true);
    try {
      await service.remove(id);
      toast.success(t("success.deleted", { resource: resourceLabel }));
      await loadItems();
    } catch (error) {
      toast.error(error.response?.data?.message || t("error.delete", { resource: resourceLabel.toLowerCase() }));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    items,
    pagination,
    isLoading,
    isSubmitting,
    reload: loadItems,
    createItem,
    updateItem,
    deleteItem,
  };
}
